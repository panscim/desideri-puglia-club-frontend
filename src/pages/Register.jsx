// src/pages/Register.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import { Mail, Lock, User, MapPin, Phone } from "lucide-react";
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

const ALLOWED_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "icloud.com",
  "me.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "libero.it",
];

function getDomain(email) {
  const parts = String(email).toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

// --- helper: carica immagine in modo compatibile (createImageBitmap o Image) ---
async function loadImageFromFile(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch (_) { }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    if (typeof createImageBitmap === "function") {
      return await createImageBitmap(img);
    }
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// --- compressione avatar: resize + WebP ---
async function compressToWebp(file, { maxPx = 384, quality = 0.82 } = {}) {
  const source = await loadImageFromFile(file);

  const srcW = source.width;
  const srcH = source.height;

  const scale = Math.min(1, maxPx / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(source, 0, 0, w, h);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );
  if (!blob) throw new Error("Impossibile comprimere immagine");

  return new File([blob], "avatar.webp", { type: "image/webp" });
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    nickname: "",
    paese: "",
    citta: "",
    via: "",
    cap: "",
    numero_civico: "",
    sesso: "",
    telefono: "",
    email: "",
    password: "",
    confirmPassword: "",
    instagram_url: "",
    facebook_url: "",
    tiktok_url: "",
    youtube_url: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Carica un file immagine valido");
      return;
    }

    const maxInputSize = 12 * 1024 * 1024; // 12MB input
    if (file.size > maxInputSize) {
      toast.error("Immagine troppo grande (max 12MB)");
      return;
    }

    try {
      // ✅ compressione reale (WebP + resize)
      const webp = await compressToWebp(file, { maxPx: 384, quality: 0.82 });

      const previewUrl = URL.createObjectURL(webp);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);

      setAvatarFile(webp);
      setAvatarPreview(previewUrl);
    } catch (err) {
      console.error(err);
      toast.error("Errore nella compressione della foto profilo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const domain = getDomain(formData.email);
    if (!ALLOWED_DOMAINS.includes(domain)) {
      toast.error("Usa una email Gmail, iCloud, Libero o Outlook");
      return;
    }

    if (
      !formData.nome.trim() ||
      !formData.cognome.trim() ||
      !formData.nickname.trim() ||
      !formData.paese.trim() ||
      !formData.citta.trim() ||
      !formData.via.trim() ||
      !formData.cap.trim() ||
      !formData.numero_civico.trim() ||
      !formData.sesso ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("La password deve essere di almeno 6 caratteri");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }

    if (!avatarFile) {
      toast.error(t('auth.profile_photo_required') || 'Carica una foto profilo per continuare')
      return;
    }

    setLoading(true);
    try {
      // 0) Upload avatar (compresso)
      const filePath = `avatars/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.webp`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "31536000",
          upsert: true,
          contentType: "image/webp",
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        toast.error("Errore nel caricamento della foto profilo");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(uploadData.path);

      const avatarUrl = publicUrlData?.publicUrl || null;

      // 1) signup + metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin + "/login",
          data: {
            nome: formData.nome.trim(),
            cognome: formData.cognome.trim(),
            nickname: formData.nickname.trim(),
            paese: formData.paese.trim(),
            citta: formData.citta.trim(),
            via: formData.via.trim(),
            cap: formData.cap.trim(),
            civico: formData.numero_civico.trim(),
            sesso: formData.sesso,
            telefono: formData.telefono.trim() || null,
            instagram_url: formData.instagram_url.trim() || null,
            facebook_url: formData.facebook_url.trim() || null,
            tiktok_url: formData.tiktok_url.trim() || null,
            youtube_url: formData.youtube_url.trim() || null,
            avatar_url: avatarUrl,
            ruolo: "Utente",
          },
        },
      });

      if (authError) throw authError;

      // 2) upsert profilo su "utenti"
      const userId = authData?.user?.id;
      if (userId) {
        const { error: profileError } = await supabase.from("utenti").upsert(
          [
            {
              id: userId,
              email: formData.email.trim(),
              nome: formData.nome.trim(),
              cognome: formData.cognome.trim(),
              nickname: formData.nickname.trim(),
              paese: formData.paese.trim(),
              citta: formData.citta.trim(),
              via: formData.via.trim(),
              cap: formData.cap.trim(),
              civico: formData.numero_civico.trim(),
              sesso: formData.sesso,
              telefono: formData.telefono.trim() || null,
              ruolo: "Utente",
              avatar_url: avatarUrl,
              instagram_url: formData.instagram_url.trim() || null,
              facebook_url: formData.facebook_url.trim() || null,
              tiktok_url: formData.tiktok_url.trim() || null,
              youtube_url: formData.youtube_url.trim() || null,
            },
          ],
          { onConflict: "id" }
        );

        if (profileError) {
          console.warn("Profile insert error (ignoro):", profileError.message);
        }
      }

      toast.success("Registrazione ok! Controlla la tua email per attivare l’account.");
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(t('common.error'))
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-warm-white to-sand relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Desideri di Puglia"
            className="w-16 h-16 rounded-full object-cover mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-olive-dark mb-2">{t('auth.join_title')}</h1>
          <p className="text-olive-light">{t('auth.join_subtitle')}</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-olive-dark mb-6">{t('auth.create_account')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FOTO PROFILO */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center overflow-hidden border border-olive-light/40">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Foto profilo"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <User className="w-7 h-7 text-olive-light" />
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-olive-dark mb-1">
                  {t('auth.profile_photo')} *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-olive-dark
                             file:mr-3 file:py-2 file:px-4
                             file:rounded-md file:border-0
                             file:text-sm file:font-semibold
                             file:bg-olive-dark file:text-sand
                             hover:file:bg-olive-light"
                  required
                />
                <p className="text-xs text-olive-light mt-1">
                  {t('auth.profile_photo_desc')}
                </p>
              </div>
            </div>

            {/* DATI */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.name')} *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                    placeholder="Mario"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.surname')} *</label>
                <input
                  type="text"
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  className="w-full px-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="Rossi"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">Nickname *</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                placeholder="puglialover"
                required
              />
              <p className="text-xs text-olive-light mt-1">
                {t('auth.nickname_desc')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.country')} *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                <input
                  type="text"
                  value={formData.paese}
                  onChange={(e) => setFormData({ ...formData, paese: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="Italia"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.city')} *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                  <input
                    type="text"
                    value={formData.citta}
                    onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                    placeholder="Bari"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">{t('auth.gender_select')} *</label>
                <select
                  value={formData.sesso}
                  onChange={(e) => setFormData({ ...formData, sesso: e.target.value })}
                  className="w-full px-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  required
                >
                  <option value="">{t('auth.gender_select')}</option>
                  <option value="M">{t('auth.gender_male')}</option>
                  <option value="F">{t('auth.gender_female')}</option>
                  <option value="Altro">{t('auth.gender_other')}</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.address')} *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                  <input
                    type="text"
                    value={formData.via}
                    onChange={(e) => setFormData({ ...formData, via: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                    placeholder="Via Roma"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.zip')} *</label>
                <input
                  type="text"
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                  className="w-full px-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="70121"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.civico') || 'Numero Civico'} *</label>
              <input
                type="text"
                value={formData.numero_civico}
                onChange={(e) => setFormData({ ...formData, numero_civico: e.target.value })}
                className="w-full px-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                placeholder="10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">
                {t('common.phone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="+39 3XX XXX XXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.email')} *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="tua@email.com"
                  required
                />
              </div>
              <p className="text-xs text-olive-light mt-1">
                {t('auth.email_allowed')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">{t('common.password')} *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  {t('auth.confirm_password')} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.register_loading') : t('auth.register_submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-olive-light">
              {t('auth.has_account')}{" "}
              <Link
                to="/login"
                className="text-olive-dark font-medium hover:text-gold transition-colors"
              >
                {t('auth.login_link')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-olive-light mt-8">
          {t('auth.terms')}
        </p>
      </div>
    </div>
  );
}
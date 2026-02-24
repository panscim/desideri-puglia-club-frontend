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
    <div className="min-h-[100dvh] flex flex-col items-center justify-start px-6 py-12 relative overflow-x-hidden bg-gradient-to-br from-[#D9D3CA] via-[#EAE5DF] to-[#C9C2B7]">
      {/* Soft blurred shapes to mimic the reference background */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format')] bg-cover bg-center opacity-40 mix-blend-overlay fixed"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9D3CA]/30 to-[#C9C2B7]/80 backdrop-blur-[2px] fixed pointer-events-none"></div>

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm w-full z-10 flex flex-col">

        {/* Intestazione */}
        <div className="mt-12 mb-10 text-left">
          <h1 className="text-[32px] font-bold text-white leading-tight font-sans drop-shadow-sm">
            Create<br />your account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          {/* Avatar Upload Container Glass */}
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.1)] relative group cursor-pointer">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex flex-col items-center justify-center text-white backdrop-blur-md">
                  <User className="w-8 h-8 mb-1 opacity-80" />
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Foto</span>
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-bold">Modifica</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Form Fields: Anagrafica */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-2 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
                placeholder={t('common.name') + " *"}
                required
              />
              <input
                type="text"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-2 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
                placeholder={t('common.surname') + " *"}
                required
              />
            </div>

            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder={t('common.nickname') + ' *'}
              required
            />

            <input
              type="text"
              value={formData.paese}
              onChange={(e) => setFormData({ ...formData, paese: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder={t('common.country') + " *"}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.citta}
                onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-2 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
                placeholder={t('common.city') + " *"}
                required
              />
              <select
                value={formData.sesso}
                onChange={(e) => setFormData({ ...formData, sesso: e.target.value })}
                className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-2 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px] [&>option]:text-zinc-900"
                required
              >
                <option value="">{t('auth.gender_select')}</option>
                <option value="M">{t('auth.gender_male')}</option>
                <option value="F">{t('auth.gender_female')}</option>
                <option value="Altro">{t('auth.gender_other')}</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                value={formData.via}
                onChange={(e) => setFormData({ ...formData, via: e.target.value })}
                className="col-span-3 w-full bg-transparent border-0 border-b border-white/60 px-0 py-2 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
                placeholder={t('common.address') + " *"}
                required
              />
              <input
                type="text"
                value={formData.numero_civico}
                onChange={(e) => setFormData({ ...formData, numero_civico: e.target.value })}
                className="col-span-1 w-full bg-transparent border-0 border-b border-white/60 px-0 py-2 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
                placeholder="Civico"
                required
              />
              <input
                type="text"
                value={formData.cap}
                onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                className="col-span-2 w-full bg-transparent border-0 border-b border-white/60 px-0 py-2 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
                placeholder={t('common.zip') + " *"}
                required
              />
            </div>

            <input
              type="tel"
              inputMode="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder={t('common.phone') + " (Opzionale)"}
            />

            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder="Email *"
              required
            />

            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder="Password *"
              required
            />
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder={t('auth.confirm_password') + " *"}
              required
            />
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex shrink-0 items-center justify-center w-5 h-5 mt-0.5">
                <input
                  type="checkbox"
                  required
                  className="peer appearance-none w-4 h-4 rounded-sm border border-white/80 bg-white/20 checked:bg-white checked:border-white transition-all cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-zinc-900 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-[12px] leading-snug text-white/90 group-hover:text-white transition-colors">
                By signing up you agree to the terms of service and privacy policy. We only accept Gmail, iCloud, Outlook, Libero, Hotmail.
              </span>
            </label>
          </div>

          <div className="pt-8 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-950 text-white font-medium text-[15px] py-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.register_loading') : 'Sign Up'}
            </button>
            <button
              type="button"
              className="w-full bg-white text-zinc-950 font-medium text-[15px] py-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              onClick={() => toast('Facebook login coming soon')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.196h3.312z" />
              </svg>
              Sign up with Facebook
            </button>
          </div>
        </form>

        <div className="pb-4 text-center mt-auto">
          <p className="text-[14px] text-white/80">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-medium hover:underline underline-offset-4">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
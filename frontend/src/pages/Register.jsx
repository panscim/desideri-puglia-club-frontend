// src/pages/Register.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import { Mail, User, MapPin } from "lucide-react";
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedAuthBackground from '../components/AnimatedAuthBackground'

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

const MONTHS_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const hasStrongPassword = (password) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasNumber && hasSpecial;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

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
  const [resendingEmail, setResendingEmail] = useState(false);

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
    data_nascita: "",
    email: "",
    password: "",
    confirmPassword: "",
    instagram_url: "",
    facebook_url: "",
    tiktok_url: "",
    youtube_url: "",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [focusedField, setFocusedField] = useState(null);

  const [permissions, setPermissions] = useState({
    location: false,
    push: false,
    photo: false,
    camera: false
  });

  const [privacyConsent, setPrivacyConsent] = useState(null); // 'accepted' | 'declined' | null

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [birthDateParts, setBirthDateParts] = useState({ day: "", month: "", year: "" });
  const today = new Date();
  const currentYear = today.getFullYear();
  const minYear = currentYear - 100;

  const selectedYear = birthDateParts.year ? Number(birthDateParts.year) : null;
  const selectedMonth = birthDateParts.month ? Number(birthDateParts.month) : null;
  const selectedDay = birthDateParts.day ? Number(birthDateParts.day) : null;

  const yearOptions = Array.from({ length: currentYear - minYear + 1 }, (_, idx) => currentYear - idx);
  const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1);
  const dayOptions =
    selectedYear && selectedMonth
      ? Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, idx) => idx + 1)
      : Array.from({ length: 31 }, (_, idx) => idx + 1);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!formData.data_nascita) return;
    const [y = "", m = "", d = ""] = formData.data_nascita.split("-");
    if (y && m && d) {
      setBirthDateParts((prev) => {
        if (prev.year === y && prev.month === String(Number(m)) && prev.day === String(Number(d))) return prev;
        return { year: y, month: String(Number(m)), day: String(Number(d)) };
      });
    }
  }, [formData.data_nascita]);

  const handleSocialLogin = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      })
      if (error) throw error
    } catch (error) {
      toast.error(error.message || t('common.error'))
    }
  }

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
    e?.preventDefault?.();

    if (currentStep !== 5) {
      toast.error("Completa lo step 5 prima di finalizzare la registrazione");
      return;
    }

    const nickname = formData.nickname.trim();
    const domain = getDomain(formData.email);
    if (!ALLOWED_DOMAINS.includes(domain)) {
      toast.error("Usa una email Gmail, iCloud, Libero o Outlook");
      return;
    }

    if (privacyConsent !== 'accepted') {
      toast.error("Devi accettare la privacy policy per registrarti.");
      return;
    }

    if (
      !formData.nome.trim() ||
      !formData.cognome.trim() ||
      !nickname ||
      !formData.data_nascita ||
      !formData.sesso ||
      !formData.telefono.trim() ||
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

    if (!hasStrongPassword(formData.password)) {
      toast.error("La password deve contenere almeno 1 maiuscola, 1 numero e 1 simbolo");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }

    // Evita errore generico Supabase (trigger su auth.users) se il nickname e' gia' usato.
    try {
      const { data: nicknameMatch, error: nicknameError } = await supabase
        .from("utenti")
        .select("id")
        .eq("nickname", nickname)
        .maybeSingle();

      if (nicknameError && nicknameError.code !== "PGRST116") throw nicknameError;
      if (nicknameMatch) {
        toast.error("Questo nickname e' gia' in uso. Scegline un altro.");
        return;
      }
    } catch (precheckError) {
      console.warn("Nickname precheck warning:", precheckError?.message || precheckError);
    }

    // if (!avatarFile) {
    //   toast.error(t('auth.profile_photo_required') || 'Carica una foto profilo per continuare')
    //   return;
    // }

    setLoading(true);
    try {
      let avatarUrl = null;
      if (avatarFile) {
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

        avatarUrl = publicUrlData?.publicUrl || null;
      }

      // 1) signup + metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin + "/login",
          data: {
            nome: formData.nome.trim(),
            cognome: formData.cognome.trim(),
            nickname,
            paese: null,
            citta: null,
            via: null,
            cap: null,
            civico: null,
            sesso: formData.sesso,
            telefono: formData.telefono.trim() || null,
            instagram_url: formData.instagram_url.trim() || null,
            facebook_url: formData.facebook_url.trim() || null,
            tiktok_url: formData.tiktok_url.trim() || null,
            youtube_url: formData.youtube_url.trim() || null,
            avatar_url: avatarUrl,
            ruolo: "Utente",
            data_nascita: formData.data_nascita || null,
          },
        },
      });

      if (authError) throw authError;
      if (!authData?.user) {
        throw new Error("Registrazione non completata. Riprova.");
      }

      // Se il provider restituisce subito sessione, la conferma email non e' richiesta.
      if (authData.session) {
        toast.success("Account creato con successo!");
        navigate("/dashboard");
        return;
      }

      // Utente gia' registrato (Supabase puo' non lanciare errore per anti-enumerazione)
      if ((authData.user.identities || []).length === 0) {
        toast("Email gia' registrata: prova ad accedere o reinvia la conferma.", { icon: "ℹ️" });
        setCurrentStep(6);
        return;
      }

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
              nickname,
              paese: null,
              citta: null,
              via: null,
              cap: null,
              civico: null,
              sesso: formData.sesso,
              telefono: formData.telefono.trim() || null,
              ruolo: "Utente",
              has_onboarding_completed: false,
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
      setCurrentStep(6); // Verifica Email
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error?.message || t('common.error'))
    } finally {
      setLoading(false);
    }
  };

  const updateBirthDatePart = (part, value) => {
    const nextParts = { ...birthDateParts, [part]: value };
    setBirthDateParts(nextParts);

    const y = nextParts.year ? Number(nextParts.year) : null;
    const m = nextParts.month ? Number(nextParts.month) : null;
    const d = nextParts.day ? Number(nextParts.day) : null;

    if (!y || !m || !d) {
      setFormData((prev) => ({ ...prev, data_nascita: "" }));
      return;
    }

    const maxDay = getDaysInMonth(y, m);
    const safeDay = Math.min(d, maxDay);

    if (safeDay !== d) {
      nextParts.day = String(safeDay);
      setBirthDateParts(nextParts);
    }

    const iso = `${String(y)}-${String(m).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    setFormData((prev) => ({ ...prev, data_nascita: iso }));
  };

  const handleResendConfirmation = async () => {
    if (!formData.email?.trim()) {
      toast.error("Inserisci prima una email valida");
      return;
    }
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email.trim(),
        options: {
          emailRedirectTo: window.location.origin + "/login",
        },
      });
      if (error) throw error;
      toast.success("Email di conferma reinviata");
    } catch (error) {
      toast.error(error?.message || "Impossibile reinviare l'email adesso");
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-6 py-12 relative overflow-hidden bg-[#EAE5DF]">
      <AnimatedAuthBackground />

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm w-full z-10 flex flex-col">

        {/* Intestazione */}
                <div className="mt-12 mb-10 text-left">
          <h1 className="text-[32px] font-black text-zinc-900 leading-[1.05] tracking-tight">
            Crea il tuo<br />profilo Club
          </h1>
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-zinc-600 mt-3">
            onboarding premium
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep === 5) handleSubmit(e);
          }}
          className="space-y-6 pb-20"
        >
          {/* Step Indicator */}
          {currentStep < 6 && (
            <div className="mb-8 w-full">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">
                  Step {currentStep} di 5
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-300/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-zinc-900 rounded-full"
                  initial={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                  animate={{ width: `${(currentStep / 5) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: IDENTITÀ (Nome, Cognome, Nickname) */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 mb-1">Chi sei?</h2>
                  <p className="text-sm text-zinc-600">Dicci come ti chiami.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <motion.div animate={{ borderColor: focusedField === 'nome' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                    <input
                      type="text"
                      value={formData.nome}
                      onFocus={() => setFocusedField('nome')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                      placeholder={t('common.name') + " *"}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <motion.div animate={{ borderColor: focusedField === 'cognome' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                    <input
                      type="text"
                      value={formData.cognome}
                      onFocus={() => setFocusedField('cognome')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                      className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                      placeholder={t('common.surname') + " *"}
                      required
                    />
                  </div>
                </div>

                <div className="relative group">
                  <motion.div animate={{ borderColor: focusedField === 'nickname' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                  <input
                    type="text"
                    value={formData.nickname}
                    onFocus={() => setFocusedField('nickname')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                    placeholder="Nickname *"
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: ANAGRAFICA (Data Nascita, Sesso) */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 mb-1">Qualche dettaglio</h2>
                  <p className="text-sm text-zinc-600">Per personalizzare la tua esperienza.</p>
                </div>

                <div className="relative group">
                  <motion.div animate={{ borderColor: focusedField === 'data_nascita' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                  <div className="px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Data di nascita *</p>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={selectedDay || ""}
                        onFocus={() => setFocusedField('data_nascita')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => updateBirthDatePart("day", e.target.value)}
                        className="bg-white/80 rounded-xl px-3 py-3 text-[14px] font-semibold text-zinc-900 border border-zinc-200 focus:outline-none"
                        required
                      >
                        <option value="">Giorno</option>
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedMonth || ""}
                        onFocus={() => setFocusedField('data_nascita')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => updateBirthDatePart("month", e.target.value)}
                        className="bg-white/80 rounded-xl px-3 py-3 text-[14px] font-semibold text-zinc-900 border border-zinc-200 focus:outline-none"
                        required
                      >
                        <option value="">Mese</option>
                        {monthOptions.map((m) => (
                          <option key={m} value={m}>
                            {MONTHS_IT[m - 1]}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedYear || ""}
                        onFocus={() => setFocusedField('data_nascita')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => updateBirthDatePart("year", e.target.value)}
                        className="bg-white/80 rounded-xl px-3 py-3 text-[14px] font-semibold text-zinc-900 border border-zinc-200 focus:outline-none"
                        required
                      >
                        <option value="">Anno</option>
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <motion.div animate={{ borderColor: focusedField === 'sesso' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                  <select
                    value={formData.sesso}
                    onFocus={() => setFocusedField('sesso')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, sesso: e.target.value })}
                    className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium appearance-none"
                    required
                  >
                    <option value="" disabled>{t('auth.gender_select')} *</option>
                    <option value="M">{t('auth.gender_male')}</option>
                    <option value="F">{t('auth.gender_female')}</option>
                    <option value="Altro">{t('auth.gender_other')}</option>
                  </select>
                </div>

                <div className="relative group">
                  <motion.div animate={{ borderColor: focusedField === 'telefono' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={formData.telefono}
                    onFocus={() => setFocusedField('telefono')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                    placeholder={t('common.phone') + " *"}
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: CREDENZIALI (Email, Pass, Conform) */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 mb-1">Proteggi l'account</h2>
                  <p className="text-sm text-zinc-600">Inserisci i dati di accesso (solo email approvate).</p>
                </div>

                <div className="relative group">
                  <motion.div animate={{ borderColor: focusedField === 'email' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                  <input
                    type="email"
                    value={formData.email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                    placeholder="Email *"
                    required
                  />
                </div>

                <div className="relative group">
                  <motion.div animate={{ borderColor: focusedField === 'password' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                  <input
                    type="password"
                    value={formData.password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                    placeholder="Password *"
                    required
                  />
                </div>
                <p className="text-[11px] text-zinc-500 px-1">
                  Minimo 6 caratteri, almeno 1 lettera maiuscola, 1 numero e 1 simbolo.
                </p>

                <div className="relative group">
                  <motion.div animate={{ borderColor: focusedField === 'confirmPassword' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(24, 24, 27, 0.15)', backgroundColor: 'rgba(255,255,255,0.6)' }} className="absolute inset-0 rounded-2xl border backdrop-blur-md -z-10" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                    placeholder={t('auth.confirm_password') + " *"}
                    required
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* STEP 4: PRIVACY CONSENT */}
          <AnimatePresence mode="wait">
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 mb-1">La tua privacy</h2>
                  <p className="text-sm text-zinc-600">Scegli le tue preferenze sui dati.</p>
                </div>

                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-zinc-200/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -z-10" />
                  <h3 className="text-sm font-bold text-zinc-900 mb-2">Trattamento Dati Personali</h3>
                  <p className="text-[12px] leading-relaxed text-zinc-600 mb-5">
                    Per offrirti i nostri servizi e personalizzare l'esperienza su Desideri di Puglia, abbiamo bisogno del tuo consenso al trattamento dei dati personali secondo la nostra Privacy Policy.
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-zinc-200/50">
                      <div className="relative flex shrink-0 items-center justify-center w-5 h-5">
                        <input
                          type="radio"
                          name="privacy"
                          value="accepted"
                          checked={privacyConsent === 'accepted'}
                          onChange={(e) => setPrivacyConsent(e.target.value)}
                          className="peer appearance-none w-5 h-5 rounded-full border-2 border-zinc-300 bg-white/50 checked:bg-zinc-900 checked:border-zinc-900 transition-all cursor-pointer shadow-sm"
                        />
                        <motion.div
                          initial={false}
                          animate={{ scale: privacyConsent === 'accepted' ? 1 : 0.5, opacity: privacyConsent === 'accepted' ? 1 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute w-2 h-2 bg-white rounded-full pointer-events-none"
                        />
                      </div>
                      <div>
                        <span className="text-[14px] font-bold text-zinc-900 block">Accetto</span>
                        <span className="text-[11px] text-zinc-500 block">Necessario per registrarsi</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-zinc-200/50">
                      <div className="relative flex shrink-0 items-center justify-center w-5 h-5">
                        <input
                          type="radio"
                          name="privacy"
                          value="declined"
                          checked={privacyConsent === 'declined'}
                          onChange={(e) => setPrivacyConsent(e.target.value)}
                          className="peer appearance-none w-5 h-5 rounded-full border-2 border-zinc-300 bg-white/50 checked:bg-zinc-900 checked:border-zinc-900 transition-all cursor-pointer shadow-sm"
                        />
                        <motion.div
                          initial={false}
                          animate={{ scale: privacyConsent === 'declined' ? 1 : 0.5, opacity: privacyConsent === 'declined' ? 1 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute w-2 h-2 bg-white rounded-full pointer-events-none"
                        />
                      </div>
                      <div>
                        <span className="text-[14px] font-bold text-zinc-900 block">Non accetto</span>
                        <span className="text-[11px] text-zinc-500 block">Interrompe la registrazione</span>
                      </div>
                    </label>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 5: PERMISSIONS & AVATAR */}
          <AnimatePresence mode="wait">
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 mb-1">Ottimizza l'app</h2>
                  <p className="text-sm text-zinc-600">Permettici di offrirti il massimo.</p>
                </div>

                {/* Avatar Upload (integrato come permesso fotocamera/libreria) */}
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-zinc-200/50 flex items-center justify-between group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                  <div className="flex items-center gap-4 relative z-10 w-full">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white bg-white/50 flex items-center justify-center shadow-sm">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] font-bold text-zinc-900 block truncate">Foto Profilo *</span>
                      <span className="text-[11px] text-zinc-500 block leading-tight">Carica una foto per farti riconoscere nella community.</span>
                    </div>
                    <div className="shrink-0 relative overflow-hidden rounded-full">
                      <input type="file" onChange={handleAvatarChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      <button type="button" className={`px-4 py-2 text-[12px] font-bold rounded-full transition-colors relative z-10 pointer-events-none ${avatarFile ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200'}`}>
                        {avatarFile ? 'Scelta' : 'Carica'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Posizione */}
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-zinc-200/50 flex items-center justify-between group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 border border-zinc-200/50 shadow-sm">
                      <MapPin size={18} className="text-zinc-600" />
                    </div>
                    <div>
                      <span className="text-[14px] font-bold text-zinc-900 block">Posizione</span>
                      <span className="text-[11px] text-zinc-500 block leading-tight">Per sbloccare missioni vicine a te.</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setPermissions(p => ({ ...p, location: !p.location }))} className={`shrink-0 px-4 py-2 text-[12px] font-bold rounded-full transition-colors ${permissions.location ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200'}`}>
                    {permissions.location ? 'On' : 'Attiva'}
                  </button>
                </div>

                {/* Push Notes */}
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-zinc-200/50 flex items-center justify-between group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 border border-zinc-200/50 shadow-sm">
                      <Mail size={18} className="text-zinc-600" />
                    </div>
                    <div>
                      <span className="text-[14px] font-bold text-zinc-900 block">Notifiche Push</span>
                      <span className="text-[11px] text-zinc-500 block leading-tight">Per non perderti eventi esclusivi.</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setPermissions(p => ({ ...p, push: !p.push }))} className={`shrink-0 px-4 py-2 text-[12px] font-bold rounded-full transition-colors ${permissions.push ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200'}`}>
                    {permissions.push ? 'On' : 'Attiva'}
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 6: VERIFICA EMAIL (Success State) */}
          <AnimatePresence mode="wait">
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 relative">
                  <div className="absolute inset-0 border-4 border-zinc-100 rounded-full" />
                  <Mail size={40} className="text-zinc-900" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Controlla la posta</h2>
                <p className="text-[15px] text-zinc-600 mb-8 max-w-[280px]">
                  Abbiamo inviato un'email a <span className="font-bold text-zinc-900">{formData.email}</span> con un link per attivare il tuo account.
                </p>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="w-full bg-zinc-950 text-white font-medium text-[15px] py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all mb-4"
                >
                  Ho verificato, vai al Login
                </motion.button>

                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                  className="text-[13px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-widest"
                >
                  {resendingEmail ? "Invio..." : "Reinvia email"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONTROLS (Steps 1-5) */}
          {currentStep < 6 && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-3">
                {/* Back Button */}
                {currentStep > 1 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="w-14 h-14 shrink-0 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-900 hover:bg-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                )}

                {/* Next / Submit Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={(e) => {
                    if (currentStep < 5) {
                      // VALIDATION BEFORE NEXT
                      if (currentStep === 1 && (!formData.nome || !formData.cognome || !formData.nickname)) {
                        toast.error("Compila tutti i campi"); return;
                      }
                      if (currentStep === 2 && (!formData.data_nascita || !formData.sesso || !formData.telefono)) {
                        toast.error("Compila tutti i campi obbligatori"); return;
                      }
                      if (currentStep === 3 && (!formData.email || !formData.password || !formData.confirmPassword)) {
                        toast.error("Inserisci credenziali valide"); return;
                      }
                      if (currentStep === 3 && !hasStrongPassword(formData.password)) {
                        toast.error("La password deve contenere almeno 1 maiuscola, 1 numero e 1 simbolo"); return;
                      }
                      if (currentStep === 3 && formData.password !== formData.confirmPassword) {
                        toast.error("Le password non coincidono"); return;
                      }
                      if (currentStep === 4 && privacyConsent !== 'accepted') {
                        toast.error("Devi accettare per continuare"); return;
                      }
                      setCurrentStep(prev => prev + 1);
                      return;
                    }
                    handleSubmit(e);
                  }}
                  disabled={loading}
                  className="flex-1 bg-zinc-950 text-white font-medium text-[15px] py-4 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? t('auth.register_loading') : (currentStep === 5 ? 'Completa Registrazione' : 'Continua')}
                </motion.button>
              </div>

              {currentStep === 1 && (
                <div className="pt-2 text-center">
                  <p className="text-[14px] text-zinc-600 font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-zinc-950 font-bold hover:underline underline-offset-4 decoration-2 decoration-zinc-950/20">
                      Log In
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

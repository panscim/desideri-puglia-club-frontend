// src/pages/Register.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import { Mail, User, MapPin, ArrowRight, ArrowLeft, Camera, ShieldCheck, CheckCircle } from "lucide-react";
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedAuthBackground from '../components/AnimatedAuthBackground'
import { colors as TOKENS, typography, motion as springMotion } from '../utils/designTokens'

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
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

const hasStrongPassword = (password) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasNumber && hasSpecial;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

// --- helper: carica immagine in modo compatibile ---
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

  const [privacyConsent, setPrivacyConsent] = useState(null);
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await compressToWebp(file, { maxPx: 384, quality: 0.82 });
      const previewUrl = URL.createObjectURL(webp);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(webp);
      setAvatarPreview(previewUrl);
    } catch (err) {
      toast.error("Errore nella foto profilo");
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.nome || !formData.cognome || !formData.nickname)) {
      toast.error("Compila tutti i campi"); return;
    }
    if (currentStep === 2 && (!formData.data_nascita || !formData.sesso)) {
      toast.error("Compila la data di nascita e il sesso"); return;
    }
    if (currentStep === 3 && (!formData.email || !formData.password)) {
      toast.error("Inserisci email e password"); return;
    }
    if (currentStep === 3) {
      if (!hasStrongPassword(formData.password)) {
        toast.error("La password deve contenere almeno 1 maiuscola, 1 numero e 1 simbolo"); return;
      }
    }
    if (currentStep === 5 && !privacyConsent) {
      toast.error("Devi accettare la privacy policy"); return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setLoading(true);

    const domain = getDomain(formData.email);
    if (!ALLOWED_DOMAINS.includes(domain)) {
      toast.error("Usa una email Gmail, iCloud, Libero o Outlook");
      setLoading(false);
      return;
    }

    try {
      let avatarUrl = null;
      if (avatarFile) {
        const filePath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { contentType: "image/webp" });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
          avatarUrl = publicUrlData?.publicUrl;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            nome: formData.nome.trim(),
            cognome: formData.cognome.trim(),
            nickname: formData.nickname.trim(),
            avatar_url: avatarUrl,
            ruolo: "Utente",
          }
        }
      });

      if (authError) throw authError;

      toast.success("Registrazione completata! Verifica la tua email.");
      setCurrentStep(6);
    } catch (error) {
      toast.error(error.message || "Errore durante la registrazione");
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
    if (y && m && d) {
      const iso = `${String(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      setFormData(prev => ({ ...prev, data_nascita: iso }));
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden" style={{ background: TOKENS.bgPrimary }}>
      <AnimatedAuthBackground />

      <div className="absolute top-8 right-8 z-50 flex items-center gap-4 pointer-events-auto">
        {currentStep > 1 && currentStep < 6 && (
          <button
            onClick={prevStep}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-stone-200 shadow-sm flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[420px] z-10 flex flex-col">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springMotion.spring}
          className="mb-12 flex flex-col items-start"
        >
          <div className="w-24 h-24 flex items-center justify-center mb-6 overflow-hidden">
            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
        </motion.div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-zinc-950 leading-tight mb-3" style={{ fontFamily: typography.serif }}>
            {currentStep === 6 ? 'Quasi fatta!' : 'Entra nel'} <br />
            <span className="text-[#D4793A] italic">{currentStep === 6 ? 'Verifica' : 'Club'}</span>
          </h1>
          <div className="w-12 h-1 bg-[#D4793A] rounded-full opacity-30" />
        </div>

        {/* Step Indicator */}
        {currentStep < 6 && (
          <div className="mb-10 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-stone-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: currentStep >= s ? '100%' : '0%' }}
                  className="h-full bg-zinc-950"
                />
              </div>
            ))}
          </div>
        )}

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springMotion.spring}
            className="min-h-[340px]"
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Identità</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl border-2 border-stone-200 bg-white/60 -z-10" />
                    <input
                      placeholder="Nome"
                      className="w-full bg-transparent border-0 px-5 py-5 text-[15px] font-bold"
                      value={formData.nome}
                      onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl border-2 border-stone-200 bg-white/60 -z-10" />
                    <input
                      placeholder="Cognome"
                      className="w-full bg-transparent border-0 px-5 py-5 text-[15px] font-bold"
                      value={formData.cognome}
                      onChange={e => setFormData({ ...formData, cognome: e.target.value })}
                    />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-2xl border-2 border-stone-200 bg-white/60 -z-10" />
                  <input
                    placeholder="Nickname Unico"
                    className="w-full bg-transparent border-0 px-5 py-5 text-[15px] font-bold"
                    value={formData.nickname}
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Dettagli personali</p>
                <div className="relative overflow-hidden rounded-3xl border-2 border-stone-200 bg-white/60 p-6 space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Data di Nascita</label>
                  <div className="grid grid-cols-3 gap-3">
                    <select className="bg-white rounded-xl h-12 px-3 font-bold border-stone-100" onChange={e => updateBirthDatePart('day', e.target.value)}>
                      <option>Giorno</option>
                      {dayOptions.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select className="bg-white rounded-xl h-12 px-3 font-bold border-stone-100" onChange={e => updateBirthDatePart('month', e.target.value)}>
                      <option>Mese</option>
                      {monthOptions.map(m => <option key={m} value={m}>{MONTHS_IT[m - 1]}</option>)}
                    </select>
                    <select className="bg-white rounded-xl h-12 px-3 font-bold border-stone-100" onChange={e => updateBirthDatePart('year', e.target.value)}>
                      <option>Anno</option>
                      {yearOptions.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-2xl border-2 border-stone-200 bg-white/60 -z-10" />
                  <select
                    className="w-full bg-transparent border-0 px-5 py-5 text-[15px] font-bold appearance-none"
                    value={formData.sesso}
                    onChange={e => setFormData({ ...formData, sesso: e.target.value })}
                  >
                    <option value="">Sesso</option>
                    <option value="M">Uomo</option>
                    <option value="F">Donna</option>
                    <option value="Altro">Altro / Non Specificato</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Credenziali</p>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-2xl border-2 border-stone-200 bg-white/60 -z-10" />
                  <input
                    placeholder="Email"
                    type="email"
                    className="w-full bg-transparent border-0 px-5 py-5 text-[15px] font-bold"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-2xl border-2 border-stone-200 bg-white/60 -z-10" />
                  <input
                    placeholder="Password"
                    type="password"
                    className="w-full bg-transparent border-0 px-5 py-5 text-[15px] font-bold"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Foto Profilo</p>
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-40 h-40 rounded-full bg-stone-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={40} className="text-stone-300" />
                      )}
                    </div>
                    <input
                      type="file"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <p className="mt-6 text-center text-sm font-medium text-zinc-500">La tua foto sarà visibile agli altri membri del Club.</p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Privacy & Consenso</p>
                <div className="bg-white/60 rounded-3xl p-6 border-2 border-stone-200 space-y-6">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="text-[#D4793A] mt-1 shrink-0" size={24} />
                    <p className="text-sm font-medium text-zinc-600 leading-relaxed">
                      Trattiamo i tuoi dati secondo la GDPR per garantirti sicurezza e personalizzazione. Accettando, dichiari di aver letto la nostra Privacy Policy.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrivacyConsent(prev => prev === 'accepted' ? null : 'accepted')}
                    className={`w-full py-4 rounded-2xl border-2 font-bold transition flex items-center justify-center gap-3 ${privacyConsent === 'accepted' ? 'border-[#D4793A] bg-[#D4793A]/10 text-[#D4793A]' : 'border-stone-200 bg-white text-zinc-400'}`}
                  >
                    {privacyConsent === 'accepted' && <CheckCircle size={20} />}
                    Accetto i Termini e la Privacy
                  </button>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="text-center space-y-8 py-8">
                <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-white shadow-lg mx-auto flex items-center justify-center">
                  <Mail className="text-emerald-500" size={32} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-zinc-950" style={{ fontFamily: typography.serif }}>Controlla la tua Email</h3>
                  <p className="text-zinc-500 font-medium">Abbiamo inviato un link di conferma a <br /><span className="text-zinc-950 font-bold">{formData.email}</span></p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 rounded-full bg-zinc-950 text-white font-black text-sm uppercase tracking-widest"
                >
                  Vai al Login
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        {currentStep < 6 && (
          <div className="mt-8">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={currentStep === 5 ? handleSubmit : nextStep}
              disabled={loading}
              className="w-full h-16 rounded-full bg-zinc-950 text-white font-black text-[15px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition hover:bg-black group"
            >
              {loading ? 'Attendere...' : (currentStep === 5 ? 'Crea Account' : 'Continua')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        )}

        {currentStep === 1 && (
          <p className="mt-8 text-center text-sm font-medium text-zinc-500">
            Hai già un account? <Link to="/login" className="text-zinc-950 font-bold underline underline-offset-4">Accedi</Link>
          </p>
        )}
      </div>
    </div>
  );
}

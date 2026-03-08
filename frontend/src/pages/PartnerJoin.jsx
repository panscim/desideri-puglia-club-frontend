// src/pages/PartnerJoin.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles,
  CreditCard,
  CheckCircle2,
  Shield,
  Building2,
  Globe,
  Instagram,
  Facebook,
  MapPin,
  TrendingUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Camera,
} from "lucide-react";
import {
  Compass,
  RocketLaunch,
  Crown,
  CurrencyEur,
  ShieldCheck
} from '@phosphor-icons/react';
import { useTranslation } from "react-i18next";

const BRAND = {
  sabbia: '#FAF7F2',
  terracotta: '#D4793A',
  blu: '#2F4858',
  sole: '#F2C87B',
  text: '#1F2933',
  muted: '#6B7280',
  divider: '#E5E7EB',
  white: '#FFFFFF',
  inkDark: '#1C2833',
};

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-30px' }}
    transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >{children}</motion.div>
);

const BUCKET = "partner-logos"; // usiamo lo stesso bucket per logo e copertina

// Categorie disponibili nel menu a tendina (Canonical IT values for DB)
const CATEGORIES_DB = [
  "Ristorante",
  "Pizzeria",
  "Pizzeria al taglio",
  "Cocktail bar",
  "Bar / Caffetteria",
  "Gelateria",
  "Pasticceria",
  "Panificio / Bakery",
  "Bistrot",
  "Enoteca / Wine bar",
  "Stabilimento balneare / Lido",
  "Hotel",
  "B&B / Affittacamere",
  "Agriturismo / Masseria",
  "Street food",
  "Fast casual",
  "Negozio di prodotti tipici",
  "Negozio di artigianato locale",
  "Boutique abbigliamento",
  "Concept store",
  "Gioielleria / Accessori",
  "Centro benessere / SPA",
  "Centro estetico",
  "Parrucchiere / Barberia",
  "Palestra / Studio fitness",
  "Attività outdoor / Tour",
  "Noleggio (bici / scooter / auto)",
  "Cantina vinicola",
  "Frantoio / Oleificio",
  "Altro",
];

const PARTNER_PLANS = [
  {
    tier: 'discovery',
    name: 'Puglia Discovery',
    productId: 'prod_U6dXaqx4SvzxdW',
    monthlyPrice: 9,
    commissionRate: 25,
    icon: Compass,
    accent: 'from-amber-300/45 to-orange-300/35',
    highlights: ["Mappa Partner", "Accesso Daily Plan", "Dashboard base"],
  },
  {
    tier: 'pro',
    name: 'Puglia Pro',
    productId: 'prod_U6dY6wVCv9xLCH',
    monthlyPrice: 29,
    commissionRate: 15,
    icon: RocketLaunch,
    accent: 'from-sky-300/45 to-cyan-300/35',
    highlights: ["Commissione ridotta", "Priorità algoritmi", "Analytics dati"],
  },
  {
    tier: 'grande',
    name: 'Grande Puglia',
    productId: 'prod_U6dZmZC556bqNX',
    monthlyPrice: 59,
    commissionRate: 10,
    icon: Crown,
    accent: 'from-emerald-300/45 to-teal-300/35',
    highlights: ["Fee minima", "Massima visibilità", "Concierge 7/7"],
  },
];

const getPartnerPlanByTier = (tier) =>
  PARTNER_PLANS.find((plan) => plan.tier === String(tier || "").toLowerCase()) || null;

const toPgTime = (v) => (v ? `${v}:00` : null); // "HH:MM" -> "HH:MM:00"

async function compressImage(file, { maxWidth, maxHeight, quality = 0.82, mimeType = "image/webp" }) {
  // fallback: se non è un'immagine
  if (!file?.type?.startsWith("image/")) throw new Error("File non immagine");

  // Carica immagine
  const bitmap = await new Promise((resolve, reject) => {
    // createImageBitmap è veloce ma non sempre disponibile su ogni caso
    if ("createImageBitmap" in window) {
      createImageBitmap(file)
        .then(resolve)
        .catch(() => {
          // fallback Image()
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
    } else {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    }
  });

  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  // Calcolo resize mantenendo proporzioni
  const ratioW = maxWidth ? maxWidth / originalWidth : 1;
  const ratioH = maxHeight ? maxHeight / originalHeight : 1;
  const ratio = Math.min(ratioW, ratioH, 1); // non ingrandire mai

  const targetWidth = Math.round(originalWidth * ratio);
  const targetHeight = Math.round(originalHeight * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  // Converti in blob compresso
  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      mimeType,
      quality
    );
  });

  if (!blob) throw new Error("Compressione fallita");

  // Crea un nuovo File per Supabase upload
  const ext = mimeType === "image/webp" ? "webp" : mimeType === "image/jpeg" ? "jpg" : "png";
  const safeName = (file.name || "image").replace(/\.[^/.]+$/, "");
  const compressedFile = new File([blob], `${safeName}.${ext}`, { type: blob.type });

  return {
    file: compressedFile,
    originalSize: file.size,
    newSize: compressedFile.size,
    width: targetWidth,
    height: targetHeight,
  };
}

export default function PartnerJoin() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const selectedPlanTier = String(params.get("plan") || "").toLowerCase();
  const selectedPlan = getPartnerPlanByTier(selectedPlanTier);

  // STATE
  const [loading, setLoading] = useState(true);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [existingPartner, setExistingPartner] = useState(null);

  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    logo_url: "",
    cover_image_url: "",
    website_url: "",
    instagram_url: "",
    facebook_url: "",
    city: "",
    category: "",
    description: "",
    address: "",
    google_maps_url: "",
    phone: "",
  });

  // orari: per ogni giorno 0-6
  const [openingHours, setOpeningHours] = useState(() =>
    Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      closed: true, // di default giorno chiuso finché non lo aprono
      open_time: "",
      close_time: "",
      break_open_time: "",
      break_close_time: "",
    }))
  );

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBusinessPhoto, setUploadingBusinessPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [businessStep, setBusinessStep] = useState(1);
  const [businessData, setBusinessData] = useState({
    name: "",
    photo: "",
    position: "",
  });

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Step interno del form (wizard 4 step)
  const [formStep, setFormStep] = useState(1);
  const TOTAL_FORM_STEPS = 4;

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const businessPhotoInputRef = useRef(null);
  const businessCameraInputRef = useRef(null);

  // Load localized lists
  const WEEKDAYS_LABELS = t('partner_join.weekdays', { returnObjects: true });
  const CATEGORIES_LABELS = t('partner_join.categories', { returnObjects: true });

  const handleNextStep = () => {
    if (formStep < TOTAL_FORM_STEPS) {
      setFormStep((s) => s + 1);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep((s) => s - 1);
    }
  };

  // 1) Controllo stato Partner / abbonamento + caricamento dati esistenti
  useEffect(() => {
    const init = async () => {
      try {
        if (!profile?.id) {
          setLoading(false);
          return;
        }

        const { data: p, error } = await supabase
          .from("partners")
          .select(
            "id,name,logo_url,cover_image_url,owner_user_id,subscription_status,plan_tier,must_choose_plan_once,city,category,website_url,instagram_url,facebook_url,description,owner_name,address,google_maps_url,phone"
          )
          .eq("owner_user_id", profile.id)
          .maybeSingle();

        if (error) console.error(error);

        setExistingPartner(p || null);

        let initialOpening = Array.from({ length: 7 }, (_, weekday) => ({
          weekday,
          closed: true,
          open_time: "",
          close_time: "",
          break_open_time: "",
          break_close_time: "",
        }));

        if (p) {
          setForm((f) => ({
            ...f,
            name: p.name || "",
            owner_name: p.owner_name || "",
            logo_url: p.logo_url || "",
            cover_image_url: p.cover_image_url || "",
            website_url: p.website_url || "",
            instagram_url: p.instagram_url || "",
            facebook_url: p.facebook_url || "",
            city: p.city || "",
            category: p.category || "",
            description: p.description || "",
            address: p.address || "",
            google_maps_url: p.google_maps_url || "",
            phone: p.phone || "",
          }));

          // carica orari se esistono
          if (p.id) {
            const { data: hoursData, error: hoursErr } = await supabase
              .from("partner_opening_hours")
              .select(
                "weekday,open_time,close_time,break_open_time,break_close_time"
              )
              .eq("partner_id", p.id)
              .order("weekday", { ascending: true });

            if (!hoursErr && hoursData) {
              hoursData.forEach((row) => {
                const i = row.weekday;
                if (i >= 0 && i < 7) {
                  initialOpening[i] = {
                    weekday: i,
                    closed:
                      !row.open_time &&
                      !row.close_time &&
                      !row.break_open_time &&
                      !row.break_close_time,
                    open_time: row.open_time
                      ? row.open_time.slice(0, 5)
                      : "",
                    close_time: row.close_time
                      ? row.close_time.slice(0, 5)
                      : "",
                    break_open_time: row.break_open_time
                      ? row.break_open_time.slice(0, 5)
                      : "",
                    break_close_time: row.break_close_time
                      ? row.break_close_time.slice(0, 5)
                      : "",
                  };
                }
              });
            }
          }
        }

        setOpeningHours(initialOpening);

        const status = (p?.subscription_status || "").toLowerCase();
        const subscriptionActive = status === "active" || status === "trialing";
        const forcePlanSelection = Boolean(p?.must_choose_plan_once) && !p?.plan_tier;

        const subscribedParam = params.get("subscribed") === "1";
        if (subscribedParam) {
          toast.success("Profilo Partner salvato.");
        }

        // Nuovi partner (nessun record) non vedono il piano.
        // Partner esistenti con forcing attivo devono passare da subscription almeno una volta.
        if (selectedPlan) {
          setHasActiveSub(true);
        } else if (!p) {
          setHasActiveSub(false);
        } else if (forcePlanSelection) {
          setHasActiveSub(subscriptionActive || subscribedParam);
        } else {
          setHasActiveSub(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [profile?.id, params, selectedPlan, t]);

  const step = useMemo(() => {
    if (!hasActiveSub) return 1; // Step 1: pagamento
    if (hasActiveSub && !existingPartner?.name) return 2; // Step 2: profilo
    return 3; // Step 3: partner già attivo
  }, [hasActiveSub, existingPartner]);

  const goToPlanDetail = (tier) => {
    navigate(`/partner/subscription/${encodeURIComponent(tier)}`);
  };

  // Upload Logo → Supabase Storage (public)
  const onUploadLogo = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un’immagine (PNG/JPG)");
      return;
    }

    // accetta anche file pesanti: li comprimiamo
    const hardMax = 12 * 1024 * 1024; // 12MB limite “di sicurezza” in input
    if (file.size > hardMax) {
      toast.error("Immagine troppo pesante (max 12MB)");
      return;
    }

    setUploadingLogo(true);
    try {
      // compressione logo (quadrato, leggero)
      const compressed = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.9,
        mimeType: "image/webp",
      });

      // opzionale: se vuoi far vedere quanto hai risparmiato
      // console.log("LOGO:", compressed.originalSize, "->", compressed.newSize);

      // dopo compressione, se ancora troppo grande:
      if (compressed.file.size > 3 * 1024 * 1024) {
        toast.error("Logo ancora troppo pesante dopo compressione (max 3MB)");
        setUploadingLogo(false);
        return;
      }

      const ext = "webp";
      const path = `${profile.id}/logo-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed.file, {
          upsert: true,
          contentType: compressed.file.type,
        });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setForm((f) => ({ ...f, logo_url: data?.publicUrl || "" }));
      toast.success("Logo caricato (ottimizzato)");
    } catch (e) {
      console.error(e);
      toast.error("Upload logo fallito");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload Cover → Supabase Storage (public)
  const onUploadCover = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un’immagine (PNG/JPG)");
      return;
    }

    const hardMax = 15 * 1024 * 1024; // 15MB in input
    if (file.size > hardMax) {
      toast.error("Immagine troppo pesante (max 15MB)");
      return;
    }

    setUploadingCover(true);
    try {
      // compressione cover (più grande ma comunque leggera)
      const compressed = await compressImage(file, {
        maxWidth: 1600,  // ottimo compromesso qualità/peso
        maxHeight: 900,
        quality: 0.82,
        mimeType: "image/webp",
      });

      // se dopo compressione è ancora enorme, fermiamo
      if (compressed.file.size > 5 * 1024 * 1024) {
        toast.error("Copertina ancora troppo pesante dopo compressione (max 5MB)");
        setUploadingCover(false);
        return;
      }

      const ext = "webp";
      const path = `${profile.id}/cover-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed.file, {
          upsert: true,
          contentType: compressed.file.type,
        });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image_url: data?.publicUrl || "" }));
      toast.success("Copertina caricata (ottimizzata)");
    } catch (e) {
      console.error(e);
      toast.error("Upload copertina fallito");
    } finally {
      setUploadingCover(false);
    }
  };

  const onUploadBusinessPhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un’immagine valida.");
      return;
    }
    setUploadingBusinessPhoto(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1400,
        maxHeight: 1000,
        quality: 0.84,
        mimeType: "image/webp",
      });
      const path = `${profile.id}/business-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed.file, { upsert: true, contentType: compressed.file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setBusinessData((prev) => ({ ...prev, photo: data?.publicUrl || "" }));
      toast.success("Foto attività caricata.");
    } catch (e) {
      console.error(e);
      toast.error("Upload foto attività fallito.");
    } finally {
      setUploadingBusinessPhoto(false);
    }
  };

  // Salvataggio orari in tabella partner_opening_hours
  const saveOpeningHours = async (partnerId) => {
    const rows = openingHours.map((d) => ({
      partner_id: partnerId,
      weekday: d.weekday,
      open_time: d.closed ? null : toPgTime(d.open_time),
      close_time: d.closed ? null : toPgTime(d.close_time),
      break_open_time: d.closed ? null : toPgTime(d.break_open_time),
      break_close_time: d.closed ? null : toPgTime(d.break_close_time),
    }));

    const { error } = await supabase
      .from("partner_opening_hours")
      .upsert(rows, { onConflict: "partner_id,weekday" });

    if (error) throw error;
  };

  const saveBusinessWizard = async ({ startCheckout = false } = {}) => {
    if (!profile?.id) return;
    if (!businessData.name.trim()) return toast.error("Inserisci il nome attività.");
    if (!businessData.photo) return toast.error("Carica una foto attività.");
    if (!businessData.position.trim()) return toast.error("Inserisci la posizione.");

    setSaving(true);
    try {
      let partnerId = existingPartner?.id || null;
      const ownerName = `${profile?.nome || ""} ${profile?.cognome || ""}`.trim() || profile?.nickname || "Titolare";

      const payload = {
        owner_user_id: profile.id,
        name: businessData.name.trim(),
        owner_name: ownerName,
        logo_url: businessData.photo,
        cover_image_url: businessData.photo,
        address: businessData.position.trim(),
        city: "Puglia",
        category: "Altro",
        is_active: false,
        subscription_status: selectedPlan ? "incomplete" : "active",
        plan_tier: selectedPlan?.tier || null,
        commission_rate: selectedPlan?.commissionRate ?? 25,
      };

      if (partnerId) {
        const { error } = await supabase.from("partners").update(payload).eq("id", partnerId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("partners").insert([payload]).select("id").single();
        if (error) throw error;
        partnerId = data?.id || null;
      }

      if (partnerId) {
        await supabase.from("utenti").update({ partner_id: partnerId }).eq("id", profile.id);
      }

      if (startCheckout && selectedPlan && partnerId) {
        const response = await fetch("/api/create-partner-subscription-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: profile.id,
            tier: selectedPlan.tier,
            successUrl: `${window.location.origin}/partner/dashboard?payments_setup_required=1&subscribed=1`,
            cancelUrl: `${window.location.origin}/partner/subscription/${encodeURIComponent(selectedPlan.tier)}?canceled=1`,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Checkout non disponibile");
        window.location.href = payload.url;
        return;
      }

      toast.success("Registrazione attività completata.");
      navigate("/partner/dashboard?payments_setup_required=1");

    } catch (e) {
      console.error(e);
      toast.error(e.message || "Errore durante la registrazione attività.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-950" />
      </div>
    );
  }

  const progress = (businessStep / 4) * 100;

  return (
    <div style={{ background: BRAND.sabbia, minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════════════════
          HERO — allineamento a sinistra, background vivo
         ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative overflow-hidden no-theme-flip" style={{ background: BRAND.inkDark, minHeight: '100dvh' }}>
        {/* Background vivo con motion */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{ background: `radial-gradient(circle, ${BRAND.terracotta}12 0%, transparent 70%)`, filter: 'blur(80px)' }}
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full"
            style={{ background: `radial-gradient(circle, ${BRAND.blu}40 0%, transparent 70%)`, filter: 'blur(100px)' }}
          />
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, minHeight: '100dvh' }}
          className="relative z-10 flex flex-col justify-center px-8 sm:px-12 max-w-5xl">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Building2 size={14} className="text-sole" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Puglia Partner Network</span>
            </div>

            <h1
              className="text-[4.2rem] sm:text-[5.5rem] font-bold leading-[0.9] tracking-tight text-white mb-2"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Il club d&apos;élite<br />
              <span className="text-sole underline decoration-sole/30">della Puglia</span><br />
              nella tua tasca.
            </h1>

            <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-xl text-white/50 font-medium">
              Entra nel cuore pulsante dell&apos;ospitalità pugliese. Non siamo una directory, siamo il pass per i membri più esclusivi del Club Desideri.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              {step === 1 && (
                <button
                  onClick={() => document.getElementById('piani-partner').scrollIntoView({ behavior: 'smooth' })}
                  className="h-[64px] px-10 rounded-full font-black text-[15px] flex items-center justify-center gap-3 transition active:scale-95 shadow-2xl"
                  style={{ background: BRAND.terracotta, color: BRAND.white, boxShadow: `0 12px 40px ${BRAND.terracotta}40` }}
                >
                  Esplora i Piani
                  <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              )}
              {step >= 2 && (
                <a
                  href={selectedPlan ? "#registrazione-rapida" : "#piani-partner"}
                  className="h-[64px] px-10 rounded-full font-black text-[15px] flex items-center justify-center gap-3 bg-white text-zinc-950 transition active:scale-95 shadow-xl"
                >
                  {selectedPlan ? "Completa Registrazione" : "Seleziona un Piano"}
                  <ArrowRight size={20} strokeWidth={2.5} />
                </a>
              )}
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute bottom-12 flex items-center gap-4 opacity-30"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20">
              <ChevronDown size={18} className="text-white" />
            </div>
            <p className="text-[11px] font-bold text-white uppercase tracking-widest">Scorri per esplorare</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PERCHÉ FARLO — LEVE CONCRETE
         ═══════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-32">
        <section className="space-y-16">
          <FadeUp>
            <div className="max-w-2xl">
              <h2 className="text-5xl font-bold leading-tight mb-6" style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.text }}>
                Perché diventare un <br />Partner Certificato?
              </h2>
              <p className="text-xl text-stone-500 font-medium leading-relaxed">
                Dimentica leDirectory classiche. Desideri di Puglia è il varco d&apos;accesso per i membri del Club nel tuo territorio.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Target Altospendente",
                desc: "I nostri soci sono viaggiatori d&apos;élite e residenti in cerca di autenticità. Clientela qualificata, non turismo di massa.",
                icon: TrendingUp,
                dark: false
              },
              {
                title: "Visibilità Esclusiva",
                desc: "Apparirai nell&apos;algoritmo di ricerca del Concierge e nei percorsi su misura generati per i soci del Club.",
                icon: Compass,
                dark: true
              },
              {
                title: "Pagamenti Garantiti",
                desc: "Gestisci prenotazioni e incassi tramite Stripe Connect. Sicurezza totale, accrediti immediati e gestione no-show.",
                icon: ShieldCheck,
                dark: false
              },
              {
                title: "Marketing Automatico",
                desc: "La tua attività viene inclusa nelle notifiche push di prossimità quando un membro è nelle vicinanze.",
                icon: Sparkles,
                dark: false
              },
              {
                title: "Costi Trasparenti",
                desc: "Piani flessibili con commissioni ridotte legate alla tua crescita. Paghi solo se ricevi prenotazioni attive.",
                icon: CurrencyEur,
                dark: false
              }
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className={`p-10 rounded-[2.5rem] flex flex-col h-full transition-all hover:shadow-2xl hover:-translate-y-1 ${item.dark ? 'bg-zinc-900 text-white' : 'bg-stone-100 border border-stone-200/50'
                  }`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm ${item.dark ? 'bg-white/10 text-white' : 'bg-white text-zinc-950'
                    }`}>
                    <item.icon size={28} weight={item.dark ? "fill" : "duotone"} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: item.dark ? 'inherit' : "'Libre Baskerville', serif" }}>{item.title}</h3>
                  <p className={`text-sm leading-relaxed ${item.dark ? 'text-white/60' : 'text-stone-500'}`}>
                    {item.desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* SCEGLI IL PIANO - Layout Asimmetrico */}
        {step === 1 && (
          <section id="piani-partner" className="max-w-7xl mx-auto px-6 py-32 bg-white/50">
            <FadeUp>
              <div className="text-center mb-20">
                <h2 className="text-[2.8rem] font-bold tracking-tight text-zinc-900" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                  Scegli il tuo impatto nel Club.
                </h2>
                <p className="mt-4 text-stone-500 font-medium">Tre livelli di partnership per scalare la tua visibilità.</p>
              </div>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              {PARTNER_PLANS.map((plan, idx) => {
                const Icon = plan.icon;
                const isPro = plan.tier === 'pro';
                const isGrande = plan.tier === 'grande';

                // Layout asimmetrico: Discovery 5, Pro 7, Grande 12
                const colSpan = idx === 0 ? 'lg:col-span-5' : isPro ? 'lg:col-span-7' : 'lg:col-span-12';

                return (
                  <article
                    key={plan.tier}
                    className={`rounded-[3rem] p-12 border border-stone-200/60 bg-white shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-[0.98] md:col-span-12 ${colSpan}`}
                  >
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${plan.accent} opacity-20 blur-3xl pointer-events-none`} />

                    <div className="relative z-10 flex-1">
                      <div className="flex items-start justify-between mb-12">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-stone-50 border border-stone-100 flex items-center justify-center shadow-sm">
                            <Icon size={32} weight="duotone" className="text-zinc-950" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold text-zinc-950" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                              {plan.name}
                            </h3>
                            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-amber-700 mt-2">
                              {idx === 0 ? 'Punto d\'ingresso' : isPro ? 'Il più scelto' : 'Partner d\'élite'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 mb-12">
                        {plan.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                              <CheckCircle2 size={14} className="text-emerald-600" strokeWidth={3} />
                            </div>
                            <span className="text-[15px] font-semibold text-zinc-800">{h}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-8 py-8 border-t border-stone-100">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-stone-400 mb-2">Commissione</p>
                          <p className="text-4xl font-black text-zinc-950">{plan.commissionRate}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-stone-400 mb-2">Canone</p>
                          <p className="text-4xl font-black text-zinc-950">
                            €{plan.monthlyPrice}
                            <span className="text-base font-bold text-stone-400">/m</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => goToPlanDetail(plan.tier)}
                        className="mt-10 w-full h-[72px] rounded-[1.8rem] bg-zinc-950 text-white text-[15px] uppercase tracking-[0.2em] font-black shadow-2xl hover:bg-black transition flex items-center justify-center gap-4 group"
                      >
                        Scopri i vantaggi
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {selectedPlan && (
          <section id="registrazione-rapida" className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">Registrazione Attività</p>
              <p className="text-[12px] font-bold text-zinc-900">{businessStep}/4</p>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-zinc-900 transition-all duration-300" style={{ width: `${(businessStep / 4) * 100}%` }} />
            </div>

            {businessStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-[24px] leading-tight text-zinc-950" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                  Come si chiama la tua attività?
                </h3>
                <p className="text-[13px] text-zinc-600">Questo nome sarà visibile ai clienti.</p>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">Nome attività</label>
                  <input
                    value={businessData.name}
                    onChange={(e) => setBusinessData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900"
                    placeholder="Nome attività"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Usa il nome che trovi anche su insegna o Google.</p>
                </div>
              </div>
            )}

            {businessStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-[24px] leading-tight text-zinc-950" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                  Carica una foto che invogli a entrare
                </h3>
                <p className="text-[13px] text-zinc-600">Una buona foto aumenta le visite.</p>
                <button
                  type="button"
                  onClick={() => businessPhotoInputRef.current?.click()}
                  className="w-full h-12 rounded-xl bg-zinc-950 text-white font-bold text-[13px]"
                >
                  {uploadingBusinessPhoto ? "Caricamento..." : "Carica foto"}
                </button>
                <button
                  type="button"
                  onClick={() => businessCameraInputRef.current?.click()}
                  className="w-full h-11 rounded-xl border border-zinc-300 bg-white text-zinc-900 font-bold text-[13px]"
                >
                  Scatta ora
                </button>
                <input
                  ref={businessPhotoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => onUploadBusinessPhoto(e.target.files?.[0])}
                />
                <input
                  ref={businessCameraInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => onUploadBusinessPhoto(e.target.files?.[0])}
                />
                {businessData.photo ? (
                  <div className="rounded-2xl overflow-hidden border border-zinc-200">
                    <img src={businessData.photo} alt="Foto attività" className="w-full h-48 object-cover" />
                  </div>
                ) : null}
                <p className="text-[11px] text-zinc-500">Deve essere chiara, luminosa, senza testo.</p>
              </div>
            )}

            {businessStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-[24px] leading-tight text-zinc-950" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                  Dove si trova?
                </h3>
                <p className="text-[13px] text-zinc-600">Serve per mostrarti sulla mappa e nei percorsi.</p>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">Cerca indirizzo</label>
                  <input
                    value={businessData.position}
                    onChange={(e) => setBusinessData((p) => ({ ...p, position: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900"
                    placeholder="Via, numero civico, città"
                  />
                </div>
              </div>
            )}

            {businessStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-[24px] leading-tight text-zinc-950" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                  Ultimo passo: attiva gli incassi
                </h3>
                <p className="text-[13px] text-zinc-600">Collegherai il conto per ricevere pagamenti automaticamente.</p>
                <ul className="space-y-2 text-[13px] text-zinc-700">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Accrediti automatici sul tuo conto</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Ticket e QR per gestire gli accessi</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Nessun inserimento manuale di documenti nell’app</li>
                </ul>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              {businessStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setBusinessStep((s) => Math.max(1, s - 1))}
                  className="px-4 py-2 text-sm font-semibold text-zinc-600"
                >
                  Indietro
                </button>
              ) : <div />}

              {businessStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (businessStep === 1 && !businessData.name.trim()) return toast.error("Inserisci il nome attività.");
                    if (businessStep === 2 && !businessData.photo) return toast.error("Carica una foto attività.");
                    if (businessStep === 3 && !businessData.position.trim()) return toast.error("Inserisci la posizione.");
                    setBusinessStep((s) => Math.min(4, s + 1));
                  }}
                  className="h-11 px-6 rounded-full bg-zinc-950 text-white text-[13px] font-bold"
                >
                  Continua
                </button>
              ) : (
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => saveBusinessWizard({ startCheckout: true })}
                    disabled={saving}
                    className="h-11 px-6 rounded-full bg-zinc-950 text-white text-[13px] font-bold disabled:opacity-60"
                  >
                    {saving ? "Salvataggio..." : "Attiva incassi"}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveBusinessWizard({ startCheckout: false })}
                    disabled={saving}
                    className="h-11 px-6 rounded-full border border-zinc-300 bg-white text-zinc-900 text-[13px] font-bold"
                  >
                    Non ora
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

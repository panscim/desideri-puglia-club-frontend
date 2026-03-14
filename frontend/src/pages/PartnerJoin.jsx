import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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
  Mail,
  X,
  Plus,
  Check
} from "lucide-react";
import {
  Compass,
  RocketLaunch,
  Crown,
  CurrencyEur,
  ShieldCheck,
  Lightning,
  QrCode,
  ChartBar,
  Bank,
  IdentificationCard
} from '@phosphor-icons/react';
import { useTranslation } from "react-i18next";
import { colors as TOKENS, typography, motion as springMotion } from "../utils/designTokens";

const TypewriterText = ({ words }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 1500);
      return;
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 75 : 150);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span className="text-[#D4793A] italic">
      {words[index].substring(0, subIndex)}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="ml-1 inline-block w-[2px] h-[1em] bg-[#D4793A] align-middle"
      />
    </span>
  );
};

const BUCKET = "partner-logos";

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
    name: 'Essenziale',
    productId: 'prod_U6dXaqx4SvzxdW',
    monthlyPrice: 0, // Gratulto in RN design
    commissionRate: 25,
    icon: Compass,
    accent: 'from-stone-200/50 to-stone-300/30',
    highlights: ["Mappa Partner", "Dettaglio attività", "Dashboard base"],
  },
  {
    tier: 'pro',
    name: 'Puglia Pro',
    productId: 'prod_U6dY6wVCv9xLCH',
    monthlyPrice: 49,
    commissionRate: 15,
    icon: RocketLaunch,
    accent: 'from-[#D4793A]/30 to-[#D4793A]/10',
    highlights: ["Eventi illimitati", "Incassi Stripe Connect", "Scanner QR Check-in", "Analisi prenotazioni"],
  },
  {
    tier: 'grande',
    name: 'Puglia Elite',
    productId: 'prod_U6dZmZC556bqNX',
    monthlyPrice: 99,
    commissionRate: 10,
    icon: Crown,
    accent: 'from-amber-200/30 to-amber-300/10',
    highlights: ["Account Manager", "Integrazioni API", "Posizionamento prioritario"],
  },
];

const WHY_ITEMS = [
  {
    Icon: Lightning,
    title: 'Visibilità reale',
    desc: 'I soci cercano esperienze in Puglia. Non sei su un aggregatore generico: sei nel Club dove vengono per trovare il meglio.',
  },
  {
    Icon: CurrencyEur,
    title: 'Incassi in 48h',
    desc: 'Stripe Connect accredita direttamente sul tuo conto. Vendi un evento stasera, incassi dopodomani.',
  },
  {
    Icon: QrCode,
    title: 'QR e accessi live',
    desc: 'Ogni biglietto genera un QR univoco. Scannerizzi all\'ingresso. Zero fogli, zero errori.',
  },
  {
    Icon: ChartBar,
    title: 'Analytics concreti',
    desc: 'Prenotazioni, fasce orarie, prodotti più venduti. Dati reali per ottimizzare ogni evento.',
  },
  {
    Icon: ShieldCheck,
    title: 'Zero burocrazia',
    desc: 'Nessun documento da caricare nell\'app. Stripe gestisce le verifiche fiscali in modo sicuro.',
  },
];

const TYPEWRITER_WORDS = [
  'Masseria',
  'Cantina',
  'Ristorante',
  'Agriturismo',
  'Boutique Hotel',
  'Lido',
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
        try { await saveOpeningHours(partnerId); } catch (e) { console.warn("Saving opening hours failed:", e); }
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

  const progress = (businessStep / 4) * 100;

  const PlanCard = ({ plan, idx, onSelect }) => {
    const Icon = plan.icon;
    const isPro = plan.tier === 'pro';
    const isGrande = plan.tier === 'grande';
    const colSpan = idx === 0 ? 'lg:col-span-12' : isPro ? 'lg:col-span-6' : 'lg:col-span-6';

    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: idx * 0.1 }}
        className={`rounded-[2.5rem] p-10 border border-stone-200/60 bg-white shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-[0.98] ${colSpan}`}
      >
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${plan.accent} opacity-30 blur-3xl pointer-events-none`} />

        <div className="relative z-10 flex-1">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center shadow-sm text-zinc-950">
                <Icon size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-950" style={{ fontFamily: typography.serif }}>
                  {plan.name}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#D4793A] mt-1">
                  {idx === 0 ? 'Punto d\'ingresso' : isPro ? 'Il più scelto' : 'Partner d\'élite'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            {plan.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-emerald-600" strokeWidth={3} />
                </div>
                <span className="text-[14px] font-semibold text-zinc-800">{h}</span>
              </div>
            ))}
          </div>

          <div className="flex items-end justify-between py-6 border-t border-stone-100">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-black text-stone-400 mb-1">Commissione</p>
              <p className="text-3xl font-black text-zinc-950">{plan.commissionRate}%</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.2em] font-black text-stone-400 mb-1">Canone</p>
              <p className="text-3xl font-black text-zinc-950">
                {plan.monthlyPrice === 0 ? "GRATIS" : `€${plan.monthlyPrice}`}
                {plan.monthlyPrice > 0 && <span className="text-sm font-bold text-stone-400">/m</span>}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelect(plan.tier)}
            className="mt-8 w-full h-[64px] rounded-2xl bg-zinc-950 text-white text-[14px] uppercase tracking-[0.2em] font-black shadow-xl hover:bg-black transition flex items-center justify-center gap-3 group"
          >
            Scegli {plan.name}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.article>
    );
  };

  return (
    <div className="min-h-screen selection:bg-[#D4793A]/30" style={{ background: TOKENS.bgPrimary }}>

      {/* HEADER / NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center bg-transparent">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl italic">D</span>
          </div>
        </Link>
        <Link to="/login" className="px-6 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-white/20 shadow-sm text-[13px] font-bold text-zinc-900 transition hover:bg-white">
          Area Riservata
        </Link>
      </nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        {/* Mesh Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[80px]"
            style={{ background: TOKENS.accent }}
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-5%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
            style={{ background: TOKENS.accentGold }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4793A]/10 border border-[#D4793A]/20 mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4793A] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4793A]">Partner Program 2026</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-zinc-950 leading-[0.9] tracking-tight mb-8" style={{ fontFamily: typography.serif }}>
              La Puglia <br />
              <span className="text-[#D4793A] italic">ti aspetta.</span>
            </h1>

            <div className="text-xl md:text-2xl font-medium text-zinc-600 mb-12 flex flex-wrap items-center gap-x-2">
              Sei una <TypewriterText words={TYPEWRITER_WORDS} />
              <span className="opacity-60">nel cuore del Club.</span>
            </div>

            <p className="text-lg md:text-xl text-zinc-500 leading-relaxed max-w-2xl mb-12">
              Entra nel network di attività selezionate. Raggiungi soci motivati, incassa online, crea esperienze autentiche. Desideri di Puglia è il tuo nuovo varco digitale.
            </p>

            <button
              onClick={() => document.getElementById('piani').scrollIntoView({ behavior: 'smooth' })}
              className="h-[72px] px-12 rounded-full bg-zinc-950 text-white font-black text-[15px] uppercase tracking-[0.2em] transition hover:bg-black active:scale-95 shadow-2xl flex items-center justify-center gap-4"
            >
              Scopri i Piani
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── WHY ────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 block mb-4">I vantaggi</span>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-950 leading-tight" style={{ fontFamily: typography.serif }}>
                Perché farlo? <br />
                <span className="text-[#D4793A]">5 motivi concreti.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-12">
              {WHY_ITEMS.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="flex gap-6 items-start"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#D4793A]/10 flex items-center justify-center shrink-0 border border-[#D4793A]/20">
                    <item.Icon size={22} className="text-[#D4793A]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-950 mb-2" style={{ fontFamily: typography.serif }}>{item.title}</h3>
                    <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PIANI ───────────────────────────────────────── */}
      <section id="piani" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-950 mb-6" style={{ fontFamily: typography.serif }}>
              Scegli la <br />misura giusta.
            </h2>
            <p className="text-zinc-500 font-medium">Nessun impegno. Cambia piano quando vuoi.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {PARTNER_PLANS.map((plan, idx) => (
              <PlanCard key={plan.tier} plan={plan} idx={idx} onSelect={(tier) => navigate(`/partner/subscription/${tier}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-zinc-200 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">
          © 2026 Desideri di Puglia — Area Partner
        </p>
      </footer>

      {/* ── REGISTRATION DRAWER / OVERLAY ────────────────── */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/20 backdrop-blur-3xl flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={springMotion.spring}
              className="w-full max-w-2xl bg-[#FAF7F2] rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_32px_80px_rgba(0,0,0,0.3)] border border-stone-200/50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-stone-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(businessStep / 5) * 100}%` }}
                  className="h-full bg-zinc-950"
                />
              </div>

              <div className="p-8 sm:p-12 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4793A]">
                    Step {businessStep} di 5
                  </span>
                  <button onClick={() => navigate('/partner/join')} className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                    <X size={16} className="text-zinc-900" />
                  </button>
                </div>

                {businessStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-4xl font-black text-zinc-950 mb-3" style={{ fontFamily: typography.serif }}>
                      Come si chiama <br />l&apos;attività?
                    </h3>
                    <p className="text-zinc-500 mb-8 font-medium">Questo nome sarà visibile ai soci del Club.</p>
                    <div className="relative group">
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-zinc-200 bg-white shadow-sm -z-10 transition-colors group-focus-within:border-zinc-950"
                      />
                      <div className="p-1 flex items-center">
                        <input
                          value={businessData.name}
                          onChange={(e) => setBusinessData(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-transparent border-0 px-5 py-5 text-zinc-950 placeholder-zinc-400 focus:ring-0 text-lg font-bold"
                          placeholder="Es. Masseria Torre Spagnola"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-4 font-bold uppercase tracking-widest">
                      Usa il nome ufficiale della struttura.
                    </p>
                  </motion.div>
                )}

                {businessStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h3 className="text-4xl font-black text-zinc-950 mb-3" style={{ fontFamily: typography.serif }}>
                      Una foto che <br />invogli a entrare.
                    </h3>
                    <p className="text-zinc-500 mb-8 font-medium">Una buona foto aumenta le visite del 40%.</p>

                    {businessData.photo ? (
                      <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-white shadow-2xl group">
                        <img src={businessData.photo} className="w-full aspect-[4/3] object-cover" alt="Preview" />
                        <button
                          onClick={() => setBusinessData(p => ({ ...p, photo: "" }))}
                          className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest"
                        >
                          Cambia
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => businessPhotoInputRef.current?.click()}
                          className="h-48 rounded-[2.5rem] bg-white border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-4 transition hover:border-[#D4793A] hover:bg-[#D4793A]/5 group"
                        >
                          <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center group-hover:scale-110 transition">
                            <Plus size={24} className="text-zinc-400 group-hover:text-[#D4793A]" />
                          </div>
                          <span className="font-bold text-zinc-400 group-hover:text-[#D4793A]">Carica Foto</span>
                        </button>
                        <button
                          onClick={() => businessCameraInputRef.current?.click()}
                          className="h-48 rounded-[2.5rem] bg-zinc-950 flex flex-col items-center justify-center gap-4 transition hover:bg-black active:scale-95 shadow-xl"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <Camera size={24} />
                          </div>
                          <span className="font-bold text-white">Scatta Ora</span>
                        </button>
                      </div>
                    )}

                    <input ref={businessPhotoInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => onUploadBusinessPhoto(e.target.files?.[0])} />
                    <input ref={businessCameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => onUploadBusinessPhoto(e.target.files?.[0])} />
                  </motion.div>
                )}

                {businessStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-4xl font-black text-zinc-950 mb-3" style={{ fontFamily: typography.serif }}>
                      Dove si <br />trova?
                    </h3>
                    <p className="text-zinc-500 mb-8 font-medium">Serve per mostrarti sulla mappa e nei percorsi.</p>
                    <div className="relative group">
                      <motion.div className="absolute inset-0 rounded-2xl border-2 border-zinc-200 bg-white shadow-sm -z-10 transition-colors group-focus-within:border-zinc-950" />
                      <div className="p-1 flex items-center">
                        <MapPin size={24} className="ml-5 text-zinc-400" />
                        <input
                          value={businessData.position}
                          onChange={(e) => setBusinessData(p => ({ ...p, position: e.target.value }))}
                          className="w-full bg-transparent border-0 px-4 py-5 text-zinc-950 placeholder-zinc-400 focus:ring-0 text-lg font-bold"
                          placeholder="Via, numero civico, città"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {businessStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                      <h3 className="text-4xl font-black text-zinc-950 mb-3" style={{ fontFamily: typography.serif }}>
                        Orari di <br />apertura.
                      </h3>
                      <p className="text-zinc-500 mb-6 font-medium">Indicaci quando sei aperto. Potrai modificarli in seguito.</p>
                    </div>

                    <div className="space-y-3">
                      {openingHours.map((day, idx) => {
                        const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
                        return (
                          <div key={idx} className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
                            {/* Day header */}
                            <div
                              className="flex items-center justify-between px-5 py-4 cursor-pointer"
                              onClick={() => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, closed: !d.closed } : d))}>
                              <span className="text-[14px] font-black text-zinc-950">{DAYS[idx]}</span>
                              <div className="flex items-center gap-3">
                                {day.closed
                                  ? <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Chiuso</span>
                                  : <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Aperto</span>}
                                <div
                                  className="w-12 h-6 rounded-full relative transition-colors"
                                  style={{ background: day.closed ? '#E5E7EB' : '#D4793A' }}>
                                  <div
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
                                    style={{ left: day.closed ? '4px' : '28px' }} />
                                </div>
                              </div>
                            </div>

                            {/* Time inputs */}
                            {!day.closed && (
                              <div className="px-5 pb-4 space-y-3 border-t border-stone-100 pt-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Apertura</label>
                                    <input
                                      type="time"
                                      value={day.open_time}
                                      onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, open_time: e.target.value } : d))}
                                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-[14px] font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Chiusura</label>
                                    <input
                                      type="time"
                                      value={day.close_time}
                                      onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, close_time: e.target.value } : d))}
                                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-[14px] font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                                    />
                                  </div>
                                </div>
                                <details className="group">
                                  <summary className="text-[10px] font-black uppercase tracking-widest text-zinc-400 cursor-pointer list-none flex items-center gap-1.5">
                                    <Plus size={10} /> Pausa pranzo
                                  </summary>
                                  <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Inizio pausa</label>
                                      <input
                                        type="time"
                                        value={day.break_open_time}
                                        onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, break_open_time: e.target.value } : d))}
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-[14px] font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Fine pausa</label>
                                      <input
                                        type="time"
                                        value={day.break_close_time}
                                        onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, break_close_time: e.target.value } : d))}
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-[14px] font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                                      />
                                    </div>
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {businessStep === 5 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div>
                      <h3 className="text-4xl font-black text-zinc-950 mb-3" style={{ fontFamily: typography.serif }}>
                        Collega <br />Stripe.
                      </h3>
                      <p className="text-zinc-500 mb-8 font-medium">Niente commissioni nascoste. Incassi garantiti in 48h.</p>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-sm space-y-6">
                      {[
                        { Icon: Bank, text: "Accrediti automatici sul tuo conto" },
                        { Icon: QrCode, text: "Ticket e QR per gestire gli accessi" },
                        { Icon: IdentificationCard, text: "Nessun dato manuale da inserire" },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                            <item.Icon size={20} className="text-emerald-600" />
                          </div>
                          <p className="text-[15px] font-semibold text-zinc-800 pt-2">{item.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-2xl border-l-[6px] border-emerald-500">
                      <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                        Sarai reindirizzato su Stripe. Sicuro, regolato, senza dati da inserire nell&apos;app.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Buttons */}
              <div className="p-8 sm:p-12 bg-stone-50 border-t border-stone-100 flex gap-4">
                {businessStep > 1 && (
                  <button
                    onClick={() => setBusinessStep(s => s - 1)}
                    className="h-16 px-8 rounded-full border-2 border-stone-200 text-zinc-600 font-bold hover:bg-white transition"
                  >
                    Indietro
                  </button>
                )}
                {businessStep < 5 ? (
                  <button
                    onClick={() => {
                      if (businessStep === 1 && !businessData.name.trim()) return toast.error("Inserisci il nome.");
                      if (businessStep === 2 && !businessData.photo) return toast.error("Carica una foto.");
                      if (businessStep === 3 && !businessData.position.trim()) return toast.error("Inserisci l'indirizzo.");
                      setBusinessStep(s => s + 1);
                    }}
                    className="flex-1 h-16 rounded-full bg-zinc-950 text-white font-black text-[15px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition hover:bg-black active:scale-95"
                  >
                    Continua
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => saveBusinessWizard({ startCheckout: true })}
                      disabled={saving}
                      className="flex-1 h-16 rounded-full bg-[#D4793A] text-white font-black text-[15px] uppercase tracking-widest shadow-[0_8px_30px_rgba(212,121,58,0.3)] flex items-center justify-center gap-3 transition hover:bg-[#c36a2f] active:scale-95 disabled:opacity-50"
                    >
                      {saving ? "Salvataggio..." : "Attiva Incassi"}
                      <Lightning size={18} weight="fill" />
                    </button>
                    <button
                      onClick={() => saveBusinessWizard({ startCheckout: false })}
                      disabled={saving}
                      className="h-16 px-8 rounded-full border-2 border-stone-200 text-zinc-600 font-bold hover:bg-white transition active:scale-95"
                    >
                      Non ora
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

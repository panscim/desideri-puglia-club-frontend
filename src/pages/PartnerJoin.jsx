// src/pages/PartnerJoin.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
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
  Tag,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const BUCKET = "partner-logos"; // usiamo lo stesso bucket per logo e copertina
const STRIPE_LINK =
  "https://buy.stripe.com/test_7sYdRbcyE9ka5ewdgggIo00"; // link pagamento 3€/mese

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
  const [saving, setSaving] = useState(false);

  // Step interno del form (wizard 3 step)
  const [formStep, setFormStep] = useState(1);
  const TOTAL_FORM_STEPS = 3;

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

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
            "id,name,logo_url,cover_image_url,owner_user_id,subscription_status,city,category,website_url,instagram_url,facebook_url,description,owner_name,address,google_maps_url,phone"
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
        const subscriptionActive =
          status === "active" || status === "trialing";

        // Se c'è il parametro ?paid=1, consideriamo sbloccato lo step 2
        const paidParam = params.get("paid") === "1";

        // Aggiorna lo stato a "active" se pagato e non già attivo/trialing
        if (paidParam && p && status !== "active" && status !== "trialing") {
          const { error: subErr } = await supabase
            .from("partners")
            .update({ subscription_status: "active" })
            .eq("id", p.id);
          if (!subErr) {
            p.subscription_status = "active";
          }
        }

        if (paidParam) {
          toast.success(t('partner_join.form.payment_success_desc'));
        }

        setHasActiveSub(subscriptionActive || paidParam);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [profile?.id, params, t]);

  // STEP logici globali
  const step = useMemo(() => {
    if (!hasActiveSub) return 1; // Step 1: pagamento
    if (hasActiveSub && !existingPartner?.name) return 2; // Step 2: profilo
    return 3; // Step 3: partner già attivo
  }, [hasActiveSub, existingPartner]);

  // 2) Vai a Stripe (link diretto)
  const startCheckout = () => {
    if (!profile?.id) {
      toast.error(t('common.login_required') || "Devi accedere per continuare.");
      navigate("/login");
      return;
    }
    window.location.href = STRIPE_LINK;
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
      // ✅ compressione logo (quadrato, leggero)
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
      toast.success("Logo caricato ✅ (ottimizzato)");
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
      // ✅ compressione cover (più grande ma comunque leggera)
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
      toast.success("Copertina caricata ✅ (ottimizzata)");
    } catch (e) {
      console.error(e);
      toast.error("Upload copertina fallito");
    } finally {
      setUploadingCover(false);
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

  // 4) Salvataggio profilo Partner + sync con utenti.partner_id
  const onSave = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) return toast.error(t('partner_join.form.name'));
    if (!form.owner_name.trim())
      return toast.error(t('partner_join.form.owner'));
    if (!form.city.trim()) return toast.error(t('partner_join.form.city'));
    if (!form.category.trim()) return toast.error(t('partner_join.form.category'));
    if (!form.address.trim())
      return toast.error(t('partner_join.form.address'));
    if (!form.phone.trim())
      return toast.error(t('partner_join.form.phone'));
    if (!form.logo_url) return toast.error(t('partner_join.form.upload_logo'));
    if (!form.cover_image_url)
      return toast.error(t('partner_join.form.upload_cover'));

    // validazione orari
    const invalidDay = openingHours.some((d) => {
      if (d.closed) return false;
      const onlyOneFirst =
        (!!d.open_time && !d.close_time) ||
        (!d.open_time && !!d.close_time);
      const onlyOneSecond =
        (!!d.break_open_time && !d.break_close_time) ||
        (!d.break_open_time && !!d.break_close_time);
      const noIntervals =
        !d.open_time &&
        !d.close_time &&
        !d.break_open_time &&
        !d.break_close_time;
      return onlyOneFirst || onlyOneSecond || noIntervals;
    });

    if (invalidDay) {
      return toast.error(
        "Controlla gli orari: per ogni giorno aperto inserisci almeno un intervallo completo (apertura e chiusura) oppure segna il giorno come chiuso."
      );
    }

    const hasAtLeastOneOpen = openingHours.some(
      (d) => !d.closed && d.open_time && d.close_time
    );

    if (!hasAtLeastOneOpen) {
      return toast.error(
        "Imposta almeno un giorno di apertura con orari."
      );
    }

    setSaving(true);
    try {
      let partnerId = existingPartner?.id || null;

      if (existingPartner?.id) {
        // 🔄 UPDATE partner esistente
        const { error } = await supabase
          .from("partners")
          .update({
            name: form.name.trim(),
            owner_name: form.owner_name.trim(),
            logo_url: form.logo_url,
            cover_image_url: form.cover_image_url,
            website_url: form.website_url || null,
            instagram_url: form.instagram_url || null,
            facebook_url: form.facebook_url || null,
            city: form.city.trim(),
            category: form.category.trim(),
            description: form.description || null,
            address: form.address || null,
            google_maps_url: form.google_maps_url || null,
            phone: form.phone.trim(),
            is_active: true,
            subscription_status: "active",
          })
          .eq("id", existingPartner.id);

        if (error) throw error;

        partnerId = existingPartner.id;
      } else {
        // 🆕 INSERT nuovo partner
        const { data, error } = await supabase
          .from("partners")
          .insert([
            {
              owner_user_id: profile.id,
              name: form.name.trim(),
              owner_name: form.owner_name.trim(),
              logo_url: form.logo_url,
              cover_image_url: form.cover_image_url,
              website_url: form.website_url || null,
              instagram_url: form.instagram_url || null,
              facebook_url: form.facebook_url || null,
              city: form.city.trim(),
              category: form.category.trim(),
              description: form.description || null,
              address: form.address || null,
              google_maps_url: form.google_maps_url || null,
              phone: form.phone.trim(),
              is_active: true,
              subscription_status: "active",
            },
          ])
          .select("id")
          .single();

        if (error) throw error;
        partnerId = data?.id || null;
      }

      // salva orari
      if (partnerId) {
        await saveOpeningHours(partnerId);
      }

      // 🔗 SYNC: aggiorna utenti.partner_id per l'utente loggato
      if (partnerId && profile?.id) {
        const { error: userErr } = await supabase
          .from("utenti")
          .update({ partner_id: partnerId })
          .eq("id", profile.id);

        if (userErr) {
          console.error("Errore sync utenti.partner_id:", userErr);
          // non blocchiamo il salvataggio se questo fallisce
        }
      }

      toast.success("Profilo Partner salvato ✅");
      navigate("/partner");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
      </div>
    );
  }

  const progress = (formStep / TOTAL_FORM_STEPS) * 100;

  return (
    <div data-theme="dp-light" className="space-y-12">
      {/* HERO — stile landing dark */}
      <section className="rounded-3xl overflow-hidden bg-gradient-to-b from-black via-[#050608] to-[#111111] text-white shadow-xl border border-neutral-900">
        <div className="py-12 px-6 md:px-10 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {t('partner_join.hero.title')}
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/70" dangerouslySetInnerHTML={{ __html: t('partner_join.hero.subtitle') }}>
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {step === 1 && (
              <button
                type="button"
                onClick={startCheckout}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-amber-400 text-black font-semibold shadow-lg hover:bg-amber-300 transition"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {t('partner_join.hero.subscribe_btn')}
              </button>
            )}

            {step >= 2 && (
              <a
                href="#registrazione"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black font-semibold shadow-lg hover:bg-neutral-100 transition"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('partner_join.hero.complete_profile_btn')}
              </a>
            )}

            <button
              type="button"
              onClick={() => navigate("/partner")}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/20 text-sm font-medium text-white/80 hover:bg-white/5 transition"
            >
              {t('partner_join.hero.view_partners_btn')}
            </button>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm text-white/70">
            <Shield className="w-4 h-4 text-amber-300" />
            <span>{t('partner_join.hero.no_strings')}</span>
          </div>

          {/* Banner tipo challenge */}
          <div className="mt-8 border border-white/10 rounded-2xl px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm text-white/70 bg-white/5">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <b>{t('partner_join.hero.promo_badge')}</b>
            </span>
            <span dangerouslySetInnerHTML={{ __html: t('partner_join.hero.promo_text') }}></span>
          </div>
        </div>
      </section>

      {/* 3 STEP — panoramica globale */}
      <section>
        <h2 className="text-center text-2xl font-semibold text-olive-dark">
          {t('partner_join.steps.title')}
        </h2>
        <p className="text-center text-sm text-olive-light mt-1">
          {t('partner_join.steps.subtitle')}
        </p>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            {
              id: 1,
              title: t('partner_join.steps.step1_title'),
              icon: <CreditCard className="w-6 h-6" />,
              text: t('partner_join.steps.step1_desc'),
            },
            {
              id: 2,
              title: t('partner_join.steps.step2_title'),
              icon: <Building2 className="w-6 h-6" />,
              text: t('partner_join.steps.step2_desc'),
            },
            {
              id: 3,
              title: t('partner_join.steps.step3_title'),
              icon: <CheckCircle2 className="w-6 h-6" />,
              text: t('partner_join.steps.step3_desc'),
            },
          ].map((s) => {
            const active = step >= s.id;
            return (
              <div
                key={s.id}
                className={`card text-center transition ${active ? "border-gold shadow-md" : ""
                  }`}
              >
                <div
                  className={`mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center ${active
                    ? "bg-olive-dark text-white"
                    : "bg-sand text-olive-dark"
                    }`}
                >
                  {s.icon}
                </div>
                <p className="text-xs uppercase tracking-wide text-olive-light mb-1">
                  Step {s.id}
                </p>
                <h3 className="font-semibold text-olive-dark">{s.title}</h3>
                <p className="text-sm text-olive-light mt-1">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* STEP 2: FORM REGISTRAZIONE PARTNER - WIZARD */}
      {(step === 2 || step === 3) && (
        <section id="registrazione" className="card">
          {/* Header specifico post-pagamento */}
          {step === 2 && (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex flex-col gap-1">
              <span className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {t('partner_join.form.payment_success')}
              </span>
              <p className="text-xs text-emerald-800">
                {t('partner_join.form.payment_success_desc')}
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            {/* COLONNA SINISTRA: Wizard form */}
            <div className="flex-1 min-w-0">
              {/* Titolo sezione */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-olive-dark">
                    {t('partner_join.form.title')}
                  </h2>
                  <p className="text-olive-light mt-1 text-sm">
                    {t('partner_join.form.subtitle')}
                  </p>
                </div>
                {step === 3 && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sand text-xs text-olive-dark font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('partner_join.form.already_active')}
                  </span>
                )}
              </div>

              {!hasActiveSub && (
                <div className="mt-3 mb-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                  {t('partner_join.form.warning_sub')}
                </div>
              )}

              {/* Progress bar interna del wizard */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1 text-xs font-medium text-olive-dark">
                  <span>
                    {t('partner_join.form.step_counter', { step: formStep, total: TOTAL_FORM_STEPS })}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-sand/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-olive-dark transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <form onSubmit={onSave} className="space-y-6">
                {/* WIZARD STEP 1: Info Generali */}
                {formStep === 1 && (
                  <div className="animate-fadeIn space-y-4">
                    <h3 className="font-semibold text-olive-dark border-b border-sand pb-1 mb-2">
                      1. {t('partner_join.form.general_info')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          {t('partner_join.form.name')}
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          className="input-field"
                          placeholder="es. Bar Centrale"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          {t('partner_join.form.owner')}
                        </label>
                        <input
                          type="text"
                          value={form.owner_name}
                          onChange={(e) =>
                            setForm({ ...form, owner_name: e.target.value })
                          }
                          className="input-field"
                          placeholder="es. Mario Rossi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-olive-dark mb-1">
                        {t('partner_join.form.category')}
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                        className="input-field"
                      >
                        <option value="">-- Seleziona --</option>
                        {CATEGORIES_DB.map((cat, i) => (
                          <option key={cat} value={cat}>
                            {CATEGORIES_LABELS[i] || cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-olive-dark mb-1">
                        {t('partner_join.form.description')}
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="input-field min-h-[80px]"
                        maxLength={500}
                        placeholder="Racconta la tua attività..."
                      />
                      <div className="text-right text-[10px] text-olive-light">
                        {form.description.length}/500
                      </div>
                    </div>
                  </div>
                )}

                {/* WIZARD STEP 2: Contatti & Location */}
                {formStep === 2 && (
                  <div className="animate-fadeIn space-y-4">
                    <h3 className="font-semibold text-olive-dark border-b border-sand pb-1 mb-2">
                      2. {t('partner_join.form.contacts_location')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          {t('partner_join.form.city')}
                        </label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) =>
                            setForm({ ...form, city: e.target.value })
                          }
                          className="input-field"
                          placeholder="es. Bari"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          {t('partner_join.form.phone')}
                        </label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          className="input-field"
                          placeholder="es. 333 1234567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-olive-dark mb-1">
                        {t('partner_join.form.address')}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-olive-light w-4 h-4" />
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                          className="input-field pl-9"
                          placeholder="Via Roma 123"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          {t('partner_join.form.website')}
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 text-olive-light w-4 h-4" />
                          <input
                            type="url"
                            value={form.website_url}
                            onChange={(e) =>
                              setForm({ ...form, website_url: e.target.value })
                            }
                            className="input-field pl-9"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          {t('partner_join.form.maps')}
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 text-olive-light w-4 h-4" />
                          <input
                            type="url"
                            value={form.google_maps_url}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                google_maps_url: e.target.value,
                              })
                            }
                            className="input-field pl-9"
                            placeholder="https://maps.app.goo.gl/..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          Instagram
                        </label>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-2.5 text-olive-light w-4 h-4" />
                          <input
                            type="url"
                            value={form.instagram_url}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                instagram_url: e.target.value,
                              })
                            }
                            className="input-field pl-9"
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-olive-dark mb-1">
                          Facebook
                        </label>
                        <div className="relative">
                          <Facebook className="absolute left-3 top-2.5 text-olive-light w-4 h-4" />
                          <input
                            type="url"
                            value={form.facebook_url}
                            onChange={(e) =>
                              setForm({ ...form, facebook_url: e.target.value })
                            }
                            className="input-field pl-9"
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* WIZARD STEP 3: Orari & Media */}
                {formStep === 3 && (
                  <div className="animate-fadeIn space-y-6">
                    <h3 className="font-semibold text-olive-dark border-b border-sand pb-1 mb-2">
                      3. {t('partner_join.form.hours_media')}
                    </h3>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-olive-dark">
                          {t('partner_join.form.opening_hours')}
                        </label>
                        <span className="text-[10px] text-olive-light">
                          {t('partner_join.form.hours_desc')}
                        </span>
                      </div>
                      <div className="space-y-3 bg-sand/10 p-3 rounded-xl border border-sand/30">
                        {openingHours.map((row, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 items-center text-xs"
                          >
                            <div className="col-span-3 font-medium text-olive-dark">
                              {WEEKDAYS_LABELS[index] || index}
                            </div>
                            <div className="col-span-2 flex items-center">
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={row.closed}
                                  onChange={(e) => {
                                    const next = [...openingHours];
                                    next[index] = {
                                      ...next[index],
                                      closed: e.target.checked,
                                    };
                                    setOpeningHours(next);
                                  }}
                                  className="rounded text-gold focus:ring-gold"
                                />
                                <span className={row.closed ? "font-bold text-rose-500" : ""}>
                                  {t('partner_join.form.closed')}
                                </span>
                              </label>
                            </div>

                            {!row.closed && (
                              <div className="col-span-7 flex flex-col gap-2 relative">
                                {/* Riga 1: Morning/All day */}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="time"
                                    value={row.open_time}
                                    onChange={(e) => {
                                      const next = [...openingHours];
                                      next[index].open_time = e.target.value;
                                      setOpeningHours(next);
                                    }}
                                    className="w-full bg-white border border-sand rounded px-1 py-0.5"
                                  />
                                  <span>-</span>
                                  <input
                                    type="time"
                                    value={row.close_time}
                                    onChange={(e) => {
                                      const next = [...openingHours];
                                      next[index].close_time = e.target.value;
                                      setOpeningHours(next);
                                    }}
                                    className="w-full bg-white border border-sand rounded px-1 py-0.5"
                                  />
                                  <span className="text-[9px] text-olive-light ml-1 whitespace-nowrap hidden sm:inline">
                                    {t('partner_join.form.morning')}
                                  </span>
                                </div>
                                {/* Riga 2: Afternoon/Evening (Opzionale) */}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="time"
                                    value={row.break_open_time}
                                    onChange={(e) => {
                                      const next = [...openingHours];
                                      next[index].break_open_time = e.target.value;
                                      setOpeningHours(next);
                                    }}
                                    className="w-full bg-white border border-sand rounded px-1 py-0.5"
                                  />
                                  <span>-</span>
                                  <input
                                    type="time"
                                    value={row.break_close_time}
                                    onChange={(e) => {
                                      const next = [...openingHours];
                                      next[index].break_close_time = e.target.value;
                                      setOpeningHours(next);
                                    }}
                                    className="w-full bg-white border border-sand rounded px-1 py-0.5"
                                  />
                                  <span className="text-[9px] text-olive-light ml-1 whitespace-nowrap hidden sm:inline">
                                    {t('partner_join.form.afternoon')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-olive-dark mb-2 mt-4">
                        {t('partner_join.form.media_title')}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-olive-dark mb-1">
                            {t('partner_join.form.upload_logo')}
                          </label>
                          <div
                            onClick={() => logoInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-sand flex flex-col items-center justify-center cursor-pointer hover:bg-sand/10 transition relative bg-white overflow-hidden"
                          >
                            {form.logo_url ? (
                              <img
                                src={form.logo_url}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <span className="text-xs text-olive-light text-center px-2">
                                {uploadingLogo ? "..." : "Clicca per caricare"}
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={logoInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              onUploadLogo(e.target.files?.[0])
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-olive-dark mb-1">
                            {t('partner_join.form.upload_cover')}
                          </label>
                          <div
                            onClick={() => coverInputRef.current?.click()}
                            className="aspect-video rounded-xl border-2 border-dashed border-sand flex flex-col items-center justify-center cursor-pointer hover:bg-sand/10 transition relative bg-white overflow-hidden"
                          >
                            {form.cover_image_url ? (
                              <img
                                src={form.cover_image_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-olive-light text-center px-2">
                                {uploadingCover ? "..." : "Carica immagine copertina"}
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={coverInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              onUploadCover(e.target.files?.[0])
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIONS WIZARD */}
                <div className="flex items-center justify-between pt-4 border-t border-sand">
                  {formStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="text-sm font-medium text-olive-light hover:text-olive-dark underline"
                    >
                      {t('partner_join.form.back_btn')}
                    </button>
                  ) : (
                    <div />
                  )}

                  {formStep < TOTAL_FORM_STEPS ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2 rounded-xl bg-olive-dark text-white font-semibold hover:opacity-90 transition shadow-lg text-sm"
                    >
                      {t('partner_join.form.next_btn')}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 rounded-xl bg-gold text-black font-semibold hover:brightness-95 transition shadow-lg disabled:opacity-50 text-sm"
                    >
                      {saving ? t('partner_join.form.saving') : t('partner_join.form.save_btn')}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* COLONNA DESTRA: Preview Card (fissa su desktop) */}
            <div className="hidden md:block w-80 shrink-0 sticky top-24">
              <p className="text-xs font-bold uppercase tracking-widest text-olive-light mb-2 text-center">
                Preview Card
              </p>
              <div className="rounded-[2rem] overflow-hidden shadow-xl bg-white border border-sand/50 transform scale-95 origin-top">
                <div className="relative h-48 w-full bg-gray-100">
                  {form.cover_image_url ? (
                    <img
                      src={form.cover_image_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                      No cover
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                </div>
                <div className="relative px-4 pb-5 -mt-10">
                  <div className="bg-white/95 backdrop-blur-xl rounded-[1.2rem] p-4 shadow-sm border border-white/50 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-olive-dark truncate mb-1 leading-tight">
                        {form.name || "Nome Locale"}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-olive-light mb-2">
                        <span className="uppercase tracking-wider">
                          {form.category || "Categoria"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-sand" />
                        <span className="truncate">
                          {form.city || "Città"}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-sand shadow-inner p-0.5 shrink-0 overflow-hidden">
                      {form.logo_url ? (
                        <img
                          src={form.logo_url}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
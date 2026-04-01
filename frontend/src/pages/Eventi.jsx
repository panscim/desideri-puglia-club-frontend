import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  ArrowUpRight,
  CalendarBlank,
  CaretLeft,
  Clock,
  MapPin,
  Sparkle,
  Ticket,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { EventsService } from '../services/events';
import { getLocalized } from '../utils/content';

const T = {
  serif: "'Libre Baskerville', 'Playfair Display', Georgia, serif",
  bgPage: '#F9F9F7',
  bgPrimary: '#FAF7F2',
  orange: '#f97316',
  terracotta: '#D4793A',
  gold: '#C4974A',
  textPri: '#1F2933',
  textMut: '#6B7280',
  border: '#E5E7EB',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const EventSkeleton = () => (
  <div
    className="overflow-hidden rounded-[1.9rem] border bg-white animate-pulse"
    style={{ borderColor: T.border, boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
  >
    <div className="h-[220px]" style={{ background: '#EEEAE3' }} />
    <div className="p-5">
      <div className="h-3 w-28 rounded-full mb-3" style={{ background: '#EEEAE3' }} />
      <div className="h-8 w-3/4 rounded-full mb-4" style={{ background: '#EEEAE3' }} />
      <div className="h-3 w-full rounded-full mb-2" style={{ background: '#EEEAE3' }} />
      <div className="h-3 w-5/6 rounded-full mb-5" style={{ background: '#EEEAE3' }} />
      <div className="h-12 w-full rounded-[1rem]" style={{ background: '#EEEAE3' }} />
    </div>
  </div>
);

function EventCard({ evento, language, onOpen }) {
  const startsAt = evento.event_date || evento.data_inizio;
  const endsAt = evento.data_fine;
  const title = getLocalized(evento, 'title', language) || evento.titolo;
  const description = getLocalized(evento, 'description', language) || evento.descrizione;
  const image = evento.image_url || evento.immagine_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1200&auto=format&fit=crop';
  const location = evento.location || evento.luogo;
  const category = evento.categoria || (evento.isGuestEvent ? 'Evento Partner' : 'Evento Club');
  const partnerName = evento.partners?.name || 'Desideri di Puglia';

  return (
    <motion.article
      variants={itemVariants}
      className="mb-5"
    >
      <button
        onClick={onOpen}
        className="group block w-full text-left overflow-hidden rounded-[1.9rem] border bg-white active:scale-[0.985] transition-transform duration-200"
        style={{
          borderColor: T.border,
          boxShadow: '0 6px 28px rgba(0,0,0,0.06)',
        }}
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 52%, transparent 100%)' }}
          />

          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            {startsAt && (
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]"
                style={{ background: 'rgba(249,249,247,0.92)', color: T.textPri }}
              >
                <CalendarBlank size={13} weight="fill" style={{ color: T.terracotta }} />
                {format(new Date(startsAt), 'd MMM', { locale: it })}
              </div>
            )}
            <div
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ background: 'rgba(212,121,58,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              {category}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-white/88">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: T.orange }}
                >
                  D
                </div>
                <span className="text-[11px] font-bold">Curato con Desideri di Puglia</span>
              </div>
              <h2
                className="text-[1.35rem] font-black leading-tight text-white"
                style={{ fontFamily: T.serif, letterSpacing: '-0.02em' }}
              >
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ background: `${T.orange}14`, color: T.terracotta }}
            >
              <Sparkle size={10} weight="fill" />
              {partnerName}
            </span>
            {evento.prezzo != null && Number(evento.prezzo) > 0 ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ background: `${T.gold}16`, color: T.gold }}
              >
                EUR {Number(evento.prezzo).toFixed(0)}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ background: 'rgba(22,163,74,0.12)', color: '#15803d' }}
              >
                Ingresso libero
              </span>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-y-2 gap-x-5 text-[12px] font-bold" style={{ color: T.textMut }}>
            {location && (
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={14} weight="fill" style={{ color: T.orange }} />
                <span className="truncate">{location}</span>
              </div>
            )}
            {startsAt && (
              <div className="flex items-center gap-2">
                <Clock size={14} weight="fill" style={{ color: T.orange }} />
                <span>{format(new Date(startsAt), 'HH:mm')}</span>
              </div>
            )}
            {(evento.capacity || evento.posti_totali) && (
              <div className="flex items-center gap-2">
                <Ticket size={14} weight="fill" style={{ color: T.orange }} />
                <span>{evento.capacity || evento.posti_totali} posti</span>
              </div>
            )}
            {endsAt && (
              <div className="flex items-center gap-2">
                <CalendarBlank size={14} weight="fill" style={{ color: T.orange }} />
                <span>Fino alle {format(new Date(endsAt), 'HH:mm')}</span>
              </div>
            )}
          </div>

          <p className="mb-5 line-clamp-3 text-[14px] leading-relaxed" style={{ color: T.textMut }}>
            {description}
          </p>

          <div
            className="flex items-center justify-between border-t pt-4"
            style={{ borderColor: T.border }}
          >
            <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: T.textMut }}>
              Apri dettaglio evento
            </span>
            <span
              className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-300 group-hover:gap-3"
              style={{ color: T.terracotta }}
            >
              Scopri
              <ArrowUpRight size={14} weight="bold" />
            </span>
          </div>
        </div>
      </button>
    </motion.article>
  );
}

export default function Eventi() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventi();
  }, []);

  const loadEventi = async () => {
    try {
      setLoading(true);
      const data = await EventsService.getActiveEvents();
      setEventi(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextLabel = useMemo(() => {
    if (!eventi.length) return 'Esperienze selezionate per vivere meglio il tempo libero in Puglia.';
    return `${eventi.length} eventi attivi selezionati per il Club.`;
  }, [eventi]);

  return (
    <div className="min-h-[100dvh] pb-24" style={{ background: T.bgPage }}>
      <div
        className="sticky top-0 z-40 border-b px-5 py-4 backdrop-blur-xl"
        style={{ background: 'rgba(249,249,247,0.86)', borderColor: T.border }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-white active:scale-95 transition-transform"
            style={{ borderColor: T.border, color: T.textPri }}
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: T.textMut }}>
              Agenda del club
            </p>
            <h1
              className="text-[1.45rem] font-black leading-none"
              style={{ fontFamily: T.serif, color: T.textPri, letterSpacing: '-0.03em' }}
            >
              Eventi
            </h1>
            <p className="mt-1 text-[12px] font-medium" style={{ color: T.textMut }}>
              {nextLabel}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 pt-6">
        <section
          className="mb-6 overflow-hidden rounded-[2rem] border px-5 py-5"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #faf7f2 100%)',
            borderColor: T.border,
            boxShadow: '0 10px 32px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[34rem]">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: T.textMut }}>
                Selezione Desideri
              </p>
              <h2
                className="mb-2 text-[1.75rem] font-black leading-[1.02]"
                style={{ fontFamily: T.serif, color: T.textPri, letterSpacing: '-0.04em' }}
              >
                Uscite curate, posti giusti, atmosfera già scelta.
              </h2>
              <p className="max-w-[32rem] text-[14px] leading-relaxed" style={{ color: T.textMut }}>
                Una raccolta più editoriale e meno rumorosa: eventi selezionati per chi vuole vivere la Puglia bene,
                senza scorrere pagine impersonali.
              </p>
            </div>
            <div
              className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl md:flex"
              style={{ background: `${T.orange}14`, color: T.terracotta }}
            >
              <Sparkle size={24} weight="fill" />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col gap-5">
            <EventSkeleton />
            <EventSkeleton />
          </div>
        ) : eventi.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {eventi.map((evento) => (
              <EventCard
                key={evento.id}
                evento={evento}
                language={i18n.language}
                onOpen={() => navigate(`/eventi/${evento.id}`)}
              />
            ))}
          </motion.div>
        ) : (
          <div
            className="mt-10 rounded-[2rem] border bg-white px-6 py-14 text-center"
            style={{ borderColor: T.border, boxShadow: '0 6px 24px rgba(0,0,0,0.05)' }}
          >
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: `${T.orange}10`, color: T.terracotta }}
            >
              <CalendarBlank size={28} weight="duotone" />
            </div>
            <h3
              className="mb-2 text-[1.3rem] font-black"
              style={{ fontFamily: T.serif, color: T.textPri }}
            >
              Nessun evento disponibile
            </h3>
            <p className="mx-auto max-w-[24rem] text-[14px] leading-relaxed" style={{ color: T.textMut }}>
              Stiamo preparando nuove uscite, cene e appuntamenti curati. Torna presto e troverai questa sezione piena.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

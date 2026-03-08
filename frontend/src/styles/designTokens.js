/**
 * ═══════════════════════════════════════════════════════════════
 *   DESIDERI PUGLIA CLUB — DESIGN TOKENS
 *   Fonte: DailyPlans.jsx + CreatorOnboarding.jsx
 *   Queste 2 pagine sono il riferimento assoluto per tutto il frontend.
 *   IMPORTA SEMPRE QUESTO FILE PRIMA DI CREARE UNA NUOVA PAGINA.
 * ═══════════════════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────────────────────
   1. FONT STACK  (il cuore del design)
─────────────────────────────────────────────────────────────── */
export const FONT = {
    /**
     * TITOLI NARRATIVI / HEADLINE — usato in DailyPlans per h1/h2 e
     * in CreatorOnboarding per i titoli di sezione e i numeri grandi.
     * Carattere preferito dall'utente. SEMPRE per titoli di impatto.
     *
     * Usage JSX: style={{ fontFamily: FONT.serif }}
     */
    serif: "'Libre Baskerville', 'Playfair Display', Georgia, serif",

    /**
     * BODY / UI / LABEL — font sans di sistema, leggero e pulito.
     * Usage JSX: style={{ fontFamily: FONT.sans }}  oppure className="font-sans"
     */
    sans: "'Inter', system-ui, sans-serif",
};

/* ─────────────────────────────────────────────────────────────
   2. PALETTE COLORI
─────────────────────────────────────────────────────────────── */
export const COLOR = {
    /* --- Backgrounds --- */
    bgBase: '#F9F9F7',   // sfondo pagina globale (DailyPlans)
    bgSabbia: '#FAF7F2',   // variante calda (CreatorOnboarding)
    bgCard: '#FFFFFF',   // card bianche
    bgDarkHero: '#1C2833',   // hero scuro cinematografico (CreatorOnboarding)
    bgNavbar: '#0f0f0f',   // navbar nera assoluta (DailyPlans)
    bgDarkCard: '#1A1710',   // card CTA scura con calore (DailyPlans CTA creator)

    /* --- Brand Puglia --- */
    terracotta: '#D4793A',   // accent brand primario (index.css)
    orange: '#f97316',   // accent vivo (orange-500, DailyPlans badge/icons)
    orangeMuted: '#C4974A',   // oro/ambra morbido (DailyPlans CTA + badge)
    blu: '#2F4858',   // blu Puglia profondo (CreatorOnboarding qualità box)
    sole: '#F2C87B',   // giallo sole — accento sui dark BG

    /* --- Testo --- */
    textPrimary: '#1F2933',   // testo principale (brand text)
    textMuted: '#6B7280',   // testo secondario / descrizioni
    textOnDark: '#FFFFFF',   // testo sopra sfondi scuri → usare SEMPRE con .text-on-image
    textDim: 'rgba(255,255,255,0.55)', // testo attenuato su hero scuro

    /* --- Bordi / Separatori --- */
    border: '#E5E7EB',   // bordi card neutri
    borderDark: 'rgba(255,255,255,0.08)', // bordi su sfondo scuro

    /* --- Glassmorphism --- */
    glassWhite: 'rgba(255,255,255,0.15)',  // badge prezzo su card foto
    glassBorder: 'rgba(255,255,255,0.20)',  // bordi glass
};

/* ─────────────────────────────────────────────────────────────
   3. BORDER RADIUS
─────────────────────────────────────────────────────────────── */
export const RADIUS = {
    card: '3rem',    // card grandi con foto — rounded-[3rem] (DailyPlans)
    panel: '2rem',    // pannelli e box sezione — rounded-[2rem]
    inner: '1.5rem',  // card interne bento — rounded-[1.5rem]
    pill: '999px',   // pill / badge
    btn: '1.25rem', // bottoni principali
    avatar: '0.875rem',// avatar squadrato con angoli
};

/* ─────────────────────────────────────────────────────────────
   4. TIPOGRAFIA — scale e pesi
─────────────────────────────────────────────────────────────── */
export const TYPE = {
    heroTitle: { fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: '0.92' },
    sectionTitle: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.05' },
    bigNumber: { fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: '1' },
    label: { fontSize: '0.625rem', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' },
    body: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: '1.65' },
    cardTitle: { fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: '1' },
};

/* ─────────────────────────────────────────────────────────────
   5. MOTION — varianti Framer Motion riutilizzabili
─────────────────────────────────────────────────────────────── */
export const MOTION = {
    /** Stagger container per liste */
    container: {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
    },
    /** Item singolo in stagger list */
    item: {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
    },
    /** Fade-in semplice dal basso — usato in sezioni */
    fadeUp: {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-30px' },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
    /** Slide-in da sinistra — usato in header DailyPlans */
    slideInLeft: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
    },
    /** Spring tap */
    tap: { whileTap: { scale: 0.97 } },
};

/* ─────────────────────────────────────────────────────────────
   6. SHADOW
─────────────────────────────────────────────────────────────── */
export const SHADOW = {
    card: '0 24px 80px rgba(0,0,0,0.12)',    // card foto DailyPlans
    panel: '0 8px 40px rgba(0,0,0,0.05)',     // pannelli bianchi
    dark: '0 32px 80px rgba(28,40,51,0.4)',  // box hero scuro
    btn: '0 16px 40px rgba(212,121,58,0.35)',// bottone terracotta
    orange: '0 4px 16px rgba(196,151,74,0.35)',// badge/btn gold
};

/* ─────────────────────────────────────────────────────────────
   7. ICONS
─────────────────────────────────────────────────────────────── */
export const ICON = {
    /**
     * Libreria preferita: @phosphor-icons/react (DailyPlans)
     * Weight standard: "bold" per UI, "fill" per badge/stato, "light" per empty states
     * Size standard: 18-20 per nav, 13-16 per inline, 32 per grandi
     *
     * Import: import { IconName } from '@phosphor-icons/react';
     * Fallback: import { IconName } from 'lucide-react';
     */
    library: '@phosphor-icons/react',
    sizeNav: 18,
    sizeInline: 14,
    sizeLarge: 32,
};

/* ─────────────────────────────────────────────────────────────
   8. PATTERN CARD FOTO (DailyPlans style)
   Il pattern più amato: card 4/5 con foto, gradient overlay scuro
   e titolo serif in basso a sinistra.
─────────────────────────────────────────────────────────────── */
export const CARD_PHOTO = {
    aspectRatio: '4/5',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    boxShadow: SHADOW.card,
    background: COLOR.bgNavbar,
    /** Overlay gradient standard */
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.15) 80%, transparent 100%)',
};

/* ─────────────────────────────────────────────────────────────
   9. NAVBAR PATTERN (DailyPlans style)
─────────────────────────────────────────────────────────────── */
export const NAVBAR = {
    background: COLOR.bgNavbar,
    borderBottom: `1px solid ${COLOR.borderDark}`,
    height: '4rem',   // h-16
    zIndex: 100,
    labelStyle: { color: 'white', fontSize: '0.625rem', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase' },
};

/* ─────────────────────────────────────────────────────────────
   10. QUICK REFERENCE — CSS inline shortcuts
─────────────────────────────────────────────────────────────── */
export const STYLE = {
    heroHeadline: {
        fontFamily: FONT.serif,
        fontSize: '2.8rem',
        fontWeight: 900,
        lineHeight: '0.9',
        letterSpacing: '-0.03em',
        color: COLOR.textPrimary,
    },
    sectionTitle: {
        fontFamily: FONT.serif,
        fontSize: '1.6rem',
        fontWeight: 700,
        lineHeight: '1.1',
        letterSpacing: '-0.02em',
        color: COLOR.textPrimary,
    },
    bigNumberLight: {
        fontFamily: FONT.serif,
        fontSize: '3.5rem',
        fontWeight: 700,
        lineHeight: '1',
        letterSpacing: '-0.04em',
        color: COLOR.textOnDark,
    },
    overline: {
        fontSize: '0.625rem',
        fontWeight: 900,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: COLOR.orange,
    },
};

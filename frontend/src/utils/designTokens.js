// src/utils/designTokens.js
// DNA estratto dai nuovi design Premium Marzo 2026

export const colors = {
    // Backgrounds
    bgPrimary: '#F9F9F7',   // Sfondo pagina globale
    bgSecondary: '#FAF7F2',   // Sabbia premium per blocchi in rilievo
    bgDark: '#0f0f0f',   // Dark mode base
    bgDark2: '#1C2833',   // Deep dark
    bgWhite: '#FFFFFF',

    // Accents
    accent: '#D4793A',   // Terracotta — Puglia Brand
    accentOrange: '#f97316',   // Orange vibrante
    accentGold: '#C4974A',   // Gold/Miele

    // Text
    textPrimary: '#1F2933',
    textMuted: '#6B7280',
    textLight: '#A0ADB8',
    textOnDark: '#FAF7F2',
    textBlack: '#000000',

    // UI
    border: 'rgba(31,41,51,0.10)',
    borderDark: 'rgba(255,255,255,0.08)',
    surface: '#FFFFFF',
    surfaceDark: 'rgba(255,255,255,0.06)',
    danger: '#C0392B',
    success: '#16a34a',
};

export const typography = {
    serif: "'Libre Baskerville', serif",
    sans: "'Inter', sans-serif",
};

export const motion = {
    // Framer Motion shared transitions
    spring: {
        type: "spring",
        damping: 18,
        stiffness: 160,
        mass: 0.8
    },
    springBouncy: {
        type: "spring",
        damping: 12,
        stiffness: 200,
        mass: 0.6
    },
    springSlow: {
        type: "spring",
        damping: 24,
        stiffness: 100,
        mass: 1.2
    },

    // Stagger delays
    staggerDelay: 0.08,
    staggerBase: 0.15
};

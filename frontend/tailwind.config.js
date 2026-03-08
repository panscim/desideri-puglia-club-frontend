/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Design System Tokens
        'bg-primary': '#FAF7F2',
        'bg-secondary': '#F9F9F7',
        'bg-dark': '#0f0f0f',
        'bg-dark-2': '#1C2833',
        'accent': '#D4793A',
        'accent-orange': '#f97316',
        'accent-gold': '#C4974A',
        'text-primary': '#1F2933',
        'text-muted': '#6B7280',
        'text-light': '#A0ADB8',
        'text-on-dark': '#FAF7F2',
        'surface': '#FFFFFF',
        'danger': '#C0392B',
        'success': '#16a34a',
        'border-default': 'rgba(31,41,51,0.10)',
        'border-dark': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"Libre Baskerville"', 'serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'card': '32px',
        'pill': '100px',
      },
      boxShadow: {
        'card': '0 24px 80px rgba(0,0,0,0.12)',
        'btn': '0 8px 40px rgba(212,121,58,0.28)',
      }
    },
  },

  plugins: [],
}
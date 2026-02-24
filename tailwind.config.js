/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Palette Puglia
        'warm-white': '#FFFDF8',
        'olive-light': '#B8B48F',
        'sand': '#EDE6D6',
        'olive-dark': '#5A5A40',
        'gold': '#D6A75D',
        'coral': '#D47B7B',
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        serif: ['"Libre Baskerville"', 'serif'],
      },
    },
  },

  plugins: [],
}
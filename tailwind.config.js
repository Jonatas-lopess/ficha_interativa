/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'base': '#0a0a0f',
        'surface': '#12121a',
        'surface-light': '#1a1a28',
        'surface-hover': '#22222f',

        // Accents
        'gold': {
          DEFAULT: '#c9a84c',
          dim: '#8a7535',
          bright: '#e6c45e',
        },
        'arcane': {
          DEFAULT: '#6b3fa0',
          dim: '#4a2b70',
          bright: '#8b5fc0',
        },

        // Text
        'parchment': {
          DEFAULT: '#e8e0d0',
          dim: '#a89e8e',
          bright: '#f5f0e5',
        },

        // Status — Estresse
        'stress-free': '#3a3a4a',
        'stress-spent': '#c9a84c',
        'stress-corrupt': '#8b1a1a',

        // Status — Lesões
        'injury-light': '#d4a843',
        'injury-severe': '#c44f2e',
        'injury-critical': '#8b1a1a',

        // Peso Divino
        'divine': {
          1: '#6b3fa0',
          2: '#7a3a90',
          3: '#9a2a6a',
          4: '#b01a4a',
          5: '#c41a2a',
        },
      },
      fontFamily: {
        'title': ['Cinzel', 'serif'],
        'body': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(201, 168, 76, 0.3)',
        'glow-arcane': '0 0 15px rgba(107, 63, 160, 0.3)',
        'glow-corrupt': '0 0 15px rgba(139, 26, 26, 0.3)',
      },
    },
  },
  plugins: [],
}

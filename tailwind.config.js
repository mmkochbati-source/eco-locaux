/** @type {import('tailwindcss').Config} */
// Configuration unifiée des trois maquettes Stitch (voir CLAUDE.md, section « Design »).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00d284',
          hover: '#05b774',
          soft: '#142323', // fond de l'entrée de menu active
          tint: '#172528', // fond des icônes de catégorie
        },
        page: '#090d12',
        chrome: '#0d131a', // sidebar / topbar
        card: '#111822',
        raised: '#182330', // boutons secondaires
        line: {
          DEFAULT: '#212d3d',
          side: '#1a2533',
          strong: '#27374a',
        },
        status: {
          'nouveau-fg': '#4f9eff',
          'nouveau-bg': '#1a2d42',
          'nouveau-bd': '#234266',
          'client-fg': '#6b96ff',
          'client-bg': '#1e2746',
          'client-bd': '#2b3967',
          'rdv-fg': '#00d284',
          'rdv-bg': '#112d23',
          'rdv-bd': '#1b4b3c',
          'contacte-bg': '#1d2736',
          'contacte-bd': '#2b384d',
        },
        prio: {
          bg: '#332212',
          bd: '#52391b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

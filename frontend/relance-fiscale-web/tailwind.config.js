/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fiscal: {
          bordeaux: '#7a1e1e',
          bordeauxFonce: '#5c1616',
          bordeauxDarkBg: '#0f0404',
          bordeauxCardDark: '#1a0909',
          bordeauxBorderDark: '#381212',
          or: '#c9a227',
        },
        risque: {
          faible: '#16a34a',
          moyen: '#d97706',
          eleve: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0c10',
        accent: '#22d3ee', // cyan — seul accent couleur (règle de sobriété)
      },
    },
  },
  plugins: [],
}

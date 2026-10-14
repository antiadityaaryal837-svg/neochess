/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chess: {
          bg: '#161512',
          card: '#262522',
          cardHover: '#312e2b',
          border: '#3c3934',
          subtle: '#8b8987',
          light: '#f0f0f0',
          green: {
            DEFAULT: '#81b64c',
            hover: '#95c65a',
            dark: '#45753b',
          },
          gold: {
            DEFAULT: '#e58f2a',
            hover: '#f59e0b',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        chess: '0 8px 24px rgba(0, 0, 0, 0.4)',
        'chess-lg': '0 16px 36px rgba(0, 0, 0, 0.6)',
        'glow-green': '0 0 20px rgba(129, 182, 76, 0.35)',
      },
    },
  },
  plugins: [],
};

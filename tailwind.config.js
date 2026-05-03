/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          primary: '#F97316',
          'primary-press': '#EA580C',
          bg: '#FFF7ED',
          surface: '#FFFFFF',
          ink: '#451A03',
          'ink-soft': '#92400E',
          accent: '#F59E0B',
          danger: '#DC2626',
        },
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['"Comic Neue"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        clay: '0 12px 24px rgba(180, 83, 9, 0.18), inset 0 2px 4px rgba(255, 255, 255, 0.7)',
        'clay-press': '0 4px 8px rgba(180, 83, 9, 0.18), inset 0 2px 4px rgba(255, 255, 255, 0.5)',
      },
      borderRadius: {
        clay: '24px',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        wiggle: 'wiggle 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 250ms ease-out',
        'slide-in-left': 'slide-in-left 250ms ease-out',
      },
    },
  },
  plugins: [],
};

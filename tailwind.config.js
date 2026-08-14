/** @type {import('tailwindcss').Config} */
module.exports = {
  // Point to all your React Native components and pages inside src/
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0B0F17',
          surface: '#111827',
          card: '#1E293B',
        },
        brand: {
          primary: '#6366F1',
          accent: '#8B5CF6',
        },
        domain: {
          productivity: '#6366F1',
          wellbeing: '#10B981',
          finance: '#F59E0B',
          sleep: '#A855F7',
          weather: '#38BDF8',
        },
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        alabaster: '#FBFBF9',
        sage: '#6B8F71',
        ink: '#1A2E22',
        pine: '#5E7166',
        spruce: '#0D1612',
        amber: '#E2A938',
      },
    },
  },
  plugins: [],
};

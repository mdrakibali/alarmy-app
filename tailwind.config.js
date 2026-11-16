/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Alba Smart Alarm Brand Palette
        brand: {
          DEFAULT: '#1652E6',
          dark: '#0B45C4',
          light: '#3B82F6',
        },
        navy: {
          DEFAULT: '#08173E',
          deep: '#060E22',
          light: '#0F2C7A',
        },
        orange: {
          DEFAULT: '#FF7A00',
          vivid: '#FF641D',
          light: '#FFA200',
        },
        ice: '#EEF4FF',
        
        // Semantic aliases for compatibility across codebase
        alabaster: '#F8FAFC',
        sage: '#1652E6',
        ink: '#08173E',
        pine: '#556889',
        spruce: '#060E22',
        amber: '#FF7A00',
      },
    },
  },
  plugins: [],
};

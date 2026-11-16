/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Alba Brand Design System
        primary: {
          DEFAULT: '#1652E6',
          dark: '#0B45C4',
          light: '#3B82F6',
        },
        secondary: {
          DEFAULT: '#FF7A00',
          dark: '#FF641D',
          light: '#FFA200',
        },
        navy: {
          DEFAULT: '#08173E',
          dark: '#060E22',
          light: '#0F2C7A',
        },
        subtext: '#556889',
        ice: '#EEF4FF',
        surface: '#FFFFFF',
        background: '#F8FAFC',
        muted: '#94A3B8',
        danger: {
          DEFAULT: '#FF2D55',
          dark: '#E02449',
        },

        // Direct aliases for easy design token usage
        brand: '#1652E6',
        accent: '#FF7A00',
        orange: '#FF7A00',
        ink: '#08173E',
        pine: '#556889',
        alabaster: '#F8FAFC',
        sage: '#1652E6',
        spruce: '#060E22',
        amber: '#FF7A00',
      },
    },
  },
  plugins: [],
};

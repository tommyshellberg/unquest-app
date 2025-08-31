const colors = require('./src/components/ui/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter-regular': ['Inter-Regular', 'sans-serif'],
        'inter-bold': ['Inter-SemiBold', 'sans-serif'],
        'canela-regular': ['CanelaTrial-Regular', 'serif'],
        'canela-bold': ['CanelaTrial-Bold', 'serif'],
      },
      colors,
    },
  },
  plugins: [],
};

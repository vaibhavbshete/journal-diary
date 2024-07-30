const defaultTheme = require('tailwindcss/defaultTheme')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily:{
        sans:['Hind',...defaultTheme.fontFamily.sans], 
       }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}


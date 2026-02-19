/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        script: ['Caveat', 'Inter', 'sans-serif'], // Fallback to Inter for Cyrillic if Caveat is missing glyphs
      },
    },
  },
  plugins: [],
}

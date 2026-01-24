/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stake: {
          dark: '#0f212e',
          darker: '#0a1929',
          light: '#1a2c3d',
        }
      }
    },
  },
  plugins: [],
}

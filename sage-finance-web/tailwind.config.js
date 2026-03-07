/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          600: '#00A86B',
          700: '#007744',
        }
      }
    },
  },
  plugins: [],
}

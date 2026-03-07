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
          50: '#f4f7f4',
          100: '#e5ebe6',
          500: '#7a967a',
          600: '#637a63',
          700: '#4f614f',
          800: '#3f4d3f',
        }
      }
    },
  },
  plugins: [],
}

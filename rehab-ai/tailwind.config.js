/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  // Theme is driven by the `dark` class on <html> (see src/hooks/ThemeProvider.jsx)
  theme: {
    extend: {},
  },
  plugins: [],
}
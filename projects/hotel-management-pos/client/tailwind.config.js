/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#14b8a6", // Teal for Petpooja feel
        background: "#0f172a", // Dark mode
        surface: "#1e293b",
        text: "#f8fafc"
      }
    },
  },
  plugins: [],
}

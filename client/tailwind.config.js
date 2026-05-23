/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        darkCard: "#151D30",
        darkCardHover: "#1E2943",
        cyberBlue: "#3B82F6",
        cyberTeal: "#06B6D4",
        accentGreen: "#10B981",
        accentRed: "#EF4444",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

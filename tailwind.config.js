/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A6EBD',
        teal: '#05AB9D',
        'light-blue': '#0594A8',
        bg: '#F8FAFC',
        'text-dark': '#1A2B3C',
        'text-muted': '#5A7184',
        border: '#E2EAF0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

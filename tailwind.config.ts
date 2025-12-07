import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./public/index.html", 
    "./*.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
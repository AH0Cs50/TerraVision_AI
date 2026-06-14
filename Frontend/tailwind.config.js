/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          950: '#0f2d1a',
          900: '#1a3d2b',
          800: '#1e4d33',
          700: '#2d6a4f',
          600: '#3a8a65',
          500: '#52a87f',
          400: '#74c69d',
          300: '#95d5b2',
          200: '#b7e4c7',
          100: '#d8f3dc',
          50:  '#f0faf3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

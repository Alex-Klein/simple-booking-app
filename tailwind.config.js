/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cabin: {
          50:  '#fdf8f0',
          100: '#faefd9',
          500: '#c47d3b',
          600: '#a8612a',
          700: '#8b4a1e',
          900: '#3d1f08',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Add this
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        success: '#10b981',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Blue
        secondary: '#6b7280', // Gray
        success: '#10b981', // Green
        error: '#ef4444', // Red
      },
    },
  },
  plugins: [],
};
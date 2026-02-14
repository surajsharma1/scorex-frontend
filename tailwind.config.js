/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme Colors
        'light-bg': '#d1ecff',
        'light-bg-alt': '#cbeaec',
        'light-primary': '#34729c',
        'light-secondary': '#6cb1da',
        'light-accent': '#6ec1d1',
        'light-dark': '#1e5470',
        
        // Dark Theme Colors
        'dark-bg': '#0a1828',
        'dark-bg-alt': '#0f2438',
        'dark-primary': '#178582',
        'dark-secondary': '#1a9a96',
        'dark-accent': '#178582',
        'dark-light': '#bfa181',

        
        // Semantic colors
        primary: {
          DEFAULT: '#34729c',
          light: '#6cb1da',
          dark: '#1e5470',
        },
        secondary: {
          DEFAULT: '#6ec1d1',
          light: '#cbeaec',
          dark: '#3f778c',
        },
        accent: {
          DEFAULT: '#6cb1da',
          light: '#d1ecff',
          dark: '#6587a1',
        },
        background: {
          DEFAULT: '#d1ecff',
          light: '#cbeaec',
          dark: '#0a1828',
          darkAlt: '#0f2438',
        },

        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f2438',
        },

        text: {
          DEFAULT: '#1e5470',
          light: '#34729c',
          dark: '#bfa181',
        },

        success: '#6ec1d1',
        error: '#e74c3c',
        warning: '#f39c12',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

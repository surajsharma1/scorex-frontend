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
        'dark-bg': '#323d42',
        'dark-bg-alt': '#38524c',
        'dark-primary': '#3f778c',
        'dark-secondary': '#6587a1',
        'dark-accent': '#8fa9b5',
        'dark-light': '#cbdced',
        
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
          dark: '#323d42',
          darkAlt: '#38524c',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#3f778c',
        },
        text: {
          DEFAULT: '#1e5470',
          light: '#34729c',
          dark: '#cbdced',
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

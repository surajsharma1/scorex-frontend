/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontSize: {
        '7xl': '4.5rem',
        '8xl': '6rem',
      },
      colors: {
        primary: {
          50: 'hsl(var(--primary-50))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
        },
        // Match dashboard green gradients
        emerald: {
          450: '#3de04a',
        }
      },
      boxShadow: {
        'glow': '0 0 20px hsl(var(--primary-500) / 0.3)',
        'glow-lg': '0 0 30px hsl(var(--primary-500) / 0.4)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '475px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 2.5vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 3vw, 1rem)',
        'fluid-base': 'clamp(1rem, 3.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 4vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 4.5vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 5vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 6vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 7vw, 3rem)',
        '7xl': '4.5rem',
        '8xl': '6rem',
      },
      fontFamily: {
        'fluid-mono': ['ui-monospace', 'monospace'],
      },
      height: {
        'screen-90': '90vh',
        'screen-85': '85vh',
      },
      maxHeight: {
        'screen-90': '90vh',
        'screen-85': '85vh',
      },
      colors: {
        primary: {
          50: 'hsl(var(--primary-50))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
        },
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
  plugins: [],
}


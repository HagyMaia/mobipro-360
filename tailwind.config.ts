import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF9E6',
          100: '#FFF4CC',
          200: '#FFE699',
          300: '#FFD966',
          400: '#FFCF33',
          DEFAULT: '#FFD400',
          600: '#E6C000',
          700: '#B38F00',
          800: '#806700',
          900: '#4D4400'
        },
        dark: {
          DEFAULT: '#071021',
          700: '#0B1624',
          800: '#071224'
        },
        success: '#00D084',
        warn: '#FFC107',
        danger: '#FF5252'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.08)',
        overlay: '0 8px 30px rgba(0,0,0,.35)'
      }
    }
  },
  plugins: []
};

export default config;

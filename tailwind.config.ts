import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8E6',
          100: '#FFF2CC',
          200: '#FEE199',
          300: '#FDD066',
          400: '#F6C433',
          DEFAULT: '#E0B800',
          600: '#C9A400',
          700: '#9C7E00',
          800: '#715C00',
          900: '#453800'
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

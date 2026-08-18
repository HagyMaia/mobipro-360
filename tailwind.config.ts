import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0EA5E9',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E'
        },
        dark: {
          DEFAULT: '#0B1220',
          800: '#111A2E',
          700: '#1A2740'
        },
        success: '#10B981',
        warn: '#F59E0B',
        danger: '#EF4444'
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

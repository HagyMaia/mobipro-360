import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          700: '#1a2235',
          800: '#13192b',
          900: '#0b0f19',
        },
        brand: {
          primary: '#FFC800',     // Amarelo Vivo 99
          hover: '#E5B400',
          dark: '#1A1A1A',        // Grafite Fundo
          surface: '#242424',     // Superfície de Cards
          border: '#333333',
        },
        status: {
          online: '#10B981',      // Verde Ativo
          offline: '#6B7280',     // Cinza Inativo
          busy: '#EF4444',        // Vermelho Ocupado
          warning: '#F59E0B',     // Laranja Alerta/Pendente
        }
      },
      boxShadow: {
        'sheet': '0 -4px 20px rgba(0, 0, 0, 0.25)',
        'floating': '0 4px 12px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
};
export default config;
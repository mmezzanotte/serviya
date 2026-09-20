/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta Daily Assist
        primary: {
          DEFAULT: '#2563EB', // Azul Eléctrico — acción y confianza
          dark: '#1D4ED8',
          light: '#3B82F6',
        },
        urgency: {
          DEFAULT: '#FF5A36', // Coral/Naranja — botones urgencia
          light: '#FF7A5C',
          dark: '#E84520',
        },
        online: {
          DEFAULT: '#10B981', // Verde Esmeralda — indicador Online
          light: '#34D399',
          dark: '#059669',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        warning: '#F59E0B',
        error: '#EF4444',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        badge: '999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 24px rgba(37,99,235,0.15)',
      },
    },
  },
  plugins: [],
};

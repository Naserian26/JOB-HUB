/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium Dark AI SaaS Theme - Lime Green Accents
        'dark-bg': '#050805',
        'dark-sidebar': '#0A0F0A',
        'dark-card': '#111411',
        'dark-border': '#1C231C',
        'lime-accent': '#9FE870',
        'lime-accent-hover': '#8DDB5A',
        // Extended lime palette for variations
        lime: {
          50: '#f9fce4',
          100: '#f3f9c8',
          200: '#e8f596',
          300: '#d8ed5f',
          400: '#c5e03b',
          500: '#9FE870',
          600: '#8DDB5A',
          700: '#76c74a',
          800: '#5fa73d',
          900: '#4a8530',
          950: '#2c4d1a',
        },
      },
      backgroundColor: {
        'dark-bg': '#050805',
        'dark-sidebar': '#0A0F0A',
        'dark-card': '#111411',
      },
      borderColor: {
        'dark-border': '#1C231C',
      },
      textColor: {
        'dark-primary': '#F5F5F5',
        'dark-secondary': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      },
      ringColor: {
        'lime-accent': '#9FE870',
      },
      borderRadius: {
        xs: '0.25rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

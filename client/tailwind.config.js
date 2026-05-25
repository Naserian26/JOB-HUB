/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ember Dark theme values
        'dark-bg': '#0c0a09',
        'dark-sidebar': '#1c1917',
        'dark-card': '#1c1917',
        'dark-border': '#292524',
        'gold-accent': '#f97316',
        'gold-accent-hover': '#ea580c',
        'lime-accent': '#f97316',
        'lime-accent-hover': '#ea580c',

        // White overrides to surface card background
        white: '#1c1917',

        // Gold palette overrides
        gold: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Alias green, lime, purple, indigo to orange/ember palette
        green: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        lime: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        purple: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        indigo: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Gray, slate, zinc, neutral mapped to Stone
        gray: {
          50: '#0c0a09',   // Main background
          100: '#1c1917',  // Surface/card background
          200: '#292524',  // Border
          300: '#44403c',  // Muted border
          400: '#a8a29e',  // Muted text
          500: '#a8a29e',  // Muted text
          600: '#d6d3d1',  // Body text
          700: '#d6d3d1',  // Body text
          800: '#fafaf9',  // Heading text
          900: '#fafaf9',  // Heading text
          950: '#fafaf9',
        },
        slate: {
          50: '#0c0a09',
          100: '#1c1917',
          200: '#292524',
          300: '#44403c',
          400: '#a8a29e',
          500: '#a8a29e',
          600: '#d6d3d1',
          700: '#d6d3d1',
          800: '#fafaf9',
          900: '#fafaf9',
          950: '#fafaf9',
        },
        zinc: {
          50: '#0c0a09',
          100: '#1c1917',
          200: '#292524',
          300: '#44403c',
          400: '#a8a29e',
          500: '#a8a29e',
          600: '#d6d3d1',
          700: '#d6d3d1',
          800: '#fafaf9',
          900: '#fafaf9',
          950: '#fafaf9',
        },
        neutral: {
          50: '#0c0a09',
          100: '#1c1917',
          200: '#292524',
          300: '#44403c',
          400: '#a8a29e',
          500: '#a8a29e',
          600: '#d6d3d1',
          700: '#d6d3d1',
          800: '#fafaf9',
          900: '#fafaf9',
          950: '#fafaf9',
        },
      },
      backgroundColor: {
        'dark-bg': '#0c0a09',
        'dark-sidebar': '#1c1917',
        'dark-card': '#1c1917',
      },
      borderColor: {
        'dark-border': '#292524',
      },
      textColor: {
        'dark-primary': '#fafaf9',
        'dark-secondary': '#d6d3d1',
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
        'gold-accent': '#f97316',
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

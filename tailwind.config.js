/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
    './app/**/*.{js,jsx,ts,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050816',
          900: '#09111f',
          850: '#0f1729',
          800: '#162138',
          700: '#20314d'
        },
        aurora: {
          300: '#fca5a5',
          400: '#f87171',
          500: '#e81116',
          600: '#c20f13'
        },
        lime: {
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(232, 17, 22, 0.2), 0 24px 80px rgba(194, 15, 19, 0.2)'
      },
      backgroundImage: {
        'dashboard-grid': 'radial-gradient(circle at top left, rgba(232,17,22,0.08), transparent 34%), radial-gradient(circle at bottom right, rgba(194,15,19,0.07), transparent 36%), linear-gradient(180deg, #ffffff 0%, #fff8f8 45%, #fff4f4 100%)'
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui']
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' }
        }
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        pulseSoft: 'pulseSoft 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
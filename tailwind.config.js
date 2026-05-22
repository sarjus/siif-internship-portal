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
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7'
        },
        lime: {
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56, 189, 248, 0.16), 0 24px 80px rgba(2, 132, 199, 0.24)'
      },
      backgroundImage: {
        'dashboard-grid': 'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(132,204,22,0.16), transparent 35%), linear-gradient(135deg, #050816 0%, #09111f 45%, #0c1322 100%)'
      },
      fontFamily: {
        sans: ['var(--font-ibm-plex-sans)', 'IBM Plex Sans', 'ui-sans-serif', 'system-ui']
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
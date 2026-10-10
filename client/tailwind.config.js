/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kawaii: {
          50: '#FFF5F8',
          100: '#FFE6EF',
          200: '#FFD1E3',
          300: '#FFA8CA',
          400: '#FF70A6',
          500: '#FF5C9E', // Primary pink
          600: '#E03D81',
          700: '#BF2264',
          800: '#9E134D',
          900: '#7D0A3B',
        },
        candy: {
          purple: '#C084FC',
          blue: '#60A5FA',
          yellow: '#FBBF24',
          mint: '#34D399',
          cream: '#FFF9FB',
        },
        dark: {
          bg: '#14101A',
          card: '#1F192B',
          cardHover: '#2A213A',
          border: '#35284B',
          text: '#F5EEF8',
          textMuted: '#B3A1C2',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'Quicksand', 'sans-serif'],
        display: ['Quicksand', 'Baloo 2', 'sans-serif'],
        hanzi: ['Noto Sans SC', 'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
        'pill': '9999px',
      },
      boxShadow: {
        'kawaii': '0 8px 24px -4px rgba(255, 92, 158, 0.22)',
        'kawaii-sm': '0 4px 12px -2px rgba(255, 92, 158, 0.16)',
        'kawaii-lg': '0 16px 36px -6px rgba(255, 92, 158, 0.28)',
        'dark-soft': '0 8px 24px -4px rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'bounce-soft': 'bounceSoft 2s infinite ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}

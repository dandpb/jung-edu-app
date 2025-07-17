/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c7d7fd',
          300: '#a5bbfb',
          400: '#8198f7',
          500: '#6172f3',
          600: '#4c51ea',
          700: '#4039d6',
          800: '#362fae',
          900: '#2f2b89',
        },
        secondary: {
          50: '#fef3f2',
          100: '#fee5e2',
          200: '#fececa',
          300: '#fcaba5',
          400: '#f97d71',
          500: '#f04438',
          600: '#de2c2c',
          700: '#bb2124',
          800: '#9a1f22',
          900: '#801f23',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
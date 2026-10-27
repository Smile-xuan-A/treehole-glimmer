/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 治愈系主题色 - 浅色
        primary: {
          light: '#d1c4e9',
          DEFAULT: '#b39ddb',
          dark: '#9575cd',
        },
        secondary: {
          DEFAULT: '#90caf9',
        },
        accent: {
          DEFAULT: '#ffcc80',
        },
        // 语义色
        rain: {
          DEFAULT: '#81d4fa',
          dark: '#4fc3f7',
        },
        sun: {
          DEFAULT: '#ffd54f',
          dark: '#ffca28',
        },
        // 深色主题覆盖
        dark: {
          bg: '#1a1a2e',
          card: '#2a2a3c',
        }
      },
      borderRadius: {
        'soft': '8px',
        'calm': '16px',
        'gentle': '24px',
        'warm': '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae0ff',
          300: '#7cc5ff',
          400: '#36a7ff',
          500: '#0c89ff',
          600: '#006aff',
          700: '#0055ff',
          800: '#0044cc',
          900: '#003399',
          950: '#001a4d',
        },
        secondary: {
          50: '#f2fbfd',
          100: '#e6f7fa',
          200: '#bfeef5',
          300: '#99e5f0',
          400: '#4dcfe6',
          500: '#00b8db',
          600: '#00a3c4',
          700: '#0088a3',
          800: '#006d82',
          900: '#005261',
          950: '#003540',
        },
        accent: {
          50: '#f8f5ff',
          100: '#f0e6ff',
          200: '#e1ccff',
          300: '#c599ff',
          400: '#a266ff',
          500: '#8033ff',
          600: '#6200ff',
          700: '#4a00d6',
          800: '#3700ab',
          900: '#240080',
          950: '#13004d',
        },
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
          950: '#0a0c0e',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { 
            textShadow: '0 0 5px rgba(98, 0, 255, 0.5), 0 0 10px rgba(98, 0, 255, 0.3)' 
          },
          '100%': { 
            textShadow: '0 0 10px rgba(98, 0, 255, 0.8), 0 0 20px rgba(98, 0, 255, 0.5)' 
          },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'rgb(var(--foreground-rgb))',
            lineHeight: '1.75',
            p: {
              marginTop: '1.5em',
              marginBottom: '1.5em',
            },
            h1: {
              letterSpacing: '-0.025em',
            },
            h2: {
              letterSpacing: '-0.025em',
            },
            h3: {
              letterSpacing: '-0.025em',
            },
          },
        },
      },
    },
  },
  plugins: [],
};
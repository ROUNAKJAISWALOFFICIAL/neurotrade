/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0e1a',
          secondary: '#111827',
          tertiary: '#1a2235',
          card: '#1e2d42',
        },
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        success: { DEFAULT: '#10b981', dark: '#059669' },
        danger: { DEFAULT: '#ef4444', dark: '#dc2626' },
        warn: { DEFAULT: '#f59e0b' },
        cyan: { DEFAULT: '#06b6d4' },
        purple: { DEFAULT: '#8b5cf6' },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
      animation: {
        'slide-in': 'slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-in': 'fadeIn 0.25s ease',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

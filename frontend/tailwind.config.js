/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          500: '#1a73e8',
          600: '#1557b0',
          700: '#174ea6',
        },
        ink: {
          DEFAULT: '#202124',
          secondary: '#5f6368',
          muted: '#80868b',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(60,64,67,.28), 0 1px 3px 1px rgba(60,64,67,.08)',
        'card-lg': '0 1px 3px 0 rgba(60,64,67,.28), 0 4px 8px 3px rgba(60,64,67,.12)',
      },
      keyframes: {
        'scan-runner': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(320%)' },
        },
      },
      animation: {
        'scan-runner': 'scan-runner 1.15s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

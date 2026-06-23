/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    typography: require('./typography'),
    extend: {
      colors: {
        dify: {
          body: '#1D1D20',
          default: '#222225',
          hover: '#27272B',
          dimmed: '#27272B',
          input: '#2A2B30',
          'bubble-answer': '#2A2B30',
          'bubble-user': '#27314D',
          border: '#3A3B40',
          'border-section': '#27272A',
          'text-primary': '#FBFBFC',
          'text-secondary': '#D9D9DE',
          'text-tertiary': 'rgba(200, 206, 218, 0.6)',
          'text-placeholder': 'rgba(200, 206, 218, 0.3)',
          accent: '#5289FF',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          700: '#374151',
          800: '#1F2A37',
          900: '#111928',
        },
        primary: {
          50: '#EBF5FF',
          100: '#E1EFFE',
          200: '#C3DDFD',
          300: '#A4CAFE',
          600: '#1C64F2',
          700: '#1A56DB',
        },
        blue: {
          500: '#E1EFFE',
        },
        green: {
          50: '#F3FAF7',
          100: '#DEF7EC',
          800: '#03543F',

        },
        yellow: {
          100: '#FDF6B2',
          800: '#723B13',
        },
        purple: {
          50: '#F6F5FF',
        },
        indigo: {
          25: '#F5F8FF',
          100: '#E0EAFF',
          600: '#444CE7',
        },
      },
      screens: {
        mobile: '100px',
        tablet: '640px',
        pc: '769px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

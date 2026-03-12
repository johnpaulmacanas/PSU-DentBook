/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#5750F1',
        stroke: '#E6EBF1',
        'stroke-dark': '#27303E',
        dark: {
          DEFAULT: '#111928',
          2: '#1F2A37',
          3: '#374151',
          4: '#4B5563',
          5: '#6B7280',
          6: '#9CA3AF',
          7: '#D1D5DB',
          8: '#E5E7EB',
        },
        gray: {
          DEFAULT: '#EFF4FB',
          dark: '#122031',
          1: '#F9FAFB',
          2: '#F3F4F6',
          3: '#E5E7EB',
          4: '#D1D5DB',
          5: '#9CA3AF',
          6: '#6B7280',
          7: '#374151',
        },
        green: {
          DEFAULT: '#22AD5C',
          dark: '#1A8245',
          light: '#2CD673',
        },
      },
      spacing: {
        4.5: '1.125rem',
        7.5: '1.875rem',
      },
    },
  },
  plugins: [],
}

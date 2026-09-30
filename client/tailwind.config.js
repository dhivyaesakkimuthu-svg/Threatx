/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FA',
        card: '#FFFFFF',
        primary: {
          dark: '#111827',
          darker: '#030712',
        },
        secondary: {
          dark: '#1F2937',
          text: '#667085',
        },
        brand: {
          blue: '#2563EB',
          teal: '#0F766E',
        },
        border: '#E5E7EB',
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

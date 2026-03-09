/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        console: {
          bg: '#041120',
          panel: '#08182c',
          panelSoft: '#0d2138',
          border: 'rgba(148, 163, 184, 0.16)',
          text: '#e2e8f0',
          muted: '#8ea5bd',
          accent: '#3b82f6',
          danger: '#fb7185',
          warn: '#f59e0b',
          success: '#22c55e'
        }
      },
      boxShadow: {
        panel: '0 20px 50px rgba(2, 6, 23, 0.28)',
        glow: '0 0 0 1px rgba(59, 130, 246, 0.18), 0 10px 40px rgba(37, 99, 235, 0.18)'
      },
      fontFamily: {
        display: ['"Segoe UI"', '"PingFang SC"', 'sans-serif']
      }
    }
  },
  plugins: []
};
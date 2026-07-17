/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 星露谷调色板（暖色调）
        'sv-grass': '#7CCB7C',
        'sv-grass-dark': '#4A9A4A',
        'sv-soil': '#8B5A2B',
        'sv-water': '#5BAEE0',
        'sv-sky': '#9DC9E8',
        'sv-sunset': '#F5A55E',
        'sv-night': '#2A3550',
        'sv-wood': '#A87B5E',
        'sv-stone': '#888888',
        'sv-text': '#3A2E25',
        'sv-text-light': '#F0E8D8',
        'sv-bg': '#F5E8D0',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
    },
  },
  plugins: [],
};

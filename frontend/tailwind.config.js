/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
        sans: ['"Noto Sans JP"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: {
          base: '#E8E5DD',
          card: '#FAF9F5',
          white: '#FFFFFF',
        },
        ink: {
          primary: '#1F1E1A',
          secondary: '#686862',
          muted: '#8A867E',
        },
        accent: {
          terracotta: '#B0573A',
          forest: '#3F7A4E',
          emerald: '#099749',
          pine: '#306748',
        },
      },
    },
  },
  plugins: [],
};

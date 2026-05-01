module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        mm: ['"Noto Serif Myanmar"', 'serif'],
        padauk: ['"Padauk"', 'sans-serif'],
      },
      keyframes: {
        'laser-shoot': {
          '0%': { transform: 'rotate(45deg) translateX(-150vw)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'rotate(45deg) translateX(150vw)', opacity: '0' },
        },
        'spin-y': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        }
      },
      animation: {
        'laser': 'laser-shoot linear infinite',
        'spin-y': 'spin-y 6s linear infinite',
      }
    },
  },
  plugins: [],
};

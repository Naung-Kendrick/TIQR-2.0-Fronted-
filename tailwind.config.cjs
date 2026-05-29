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
        sans:   ['"Helvetica Neue"', 'Helvetica', 'Arial', 'Inter', 'sans-serif'],
        mono:   ['"JetBrains Mono"', 'monospace'],
        mm:     ['"Noto Serif Myanmar"', 'serif'],
        padauk: ['"Padauk"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm:      '0px',
        md:      '0px',
        lg:      '0px',
        xl:      '0px',
        '2xl':   '0px',
        '3xl':   '0px',
        full:    '0px',
      },
      boxShadow: {
        sm:  'none',
        DEFAULT: 'none',
        md:  'none',
        lg:  'none',
        xl:  'none',
        '2xl': 'none',
      },
      keyframes: {
        'tps-page-in': {
          'from': { opacity: '0', transform: 'translateY(6px)' },
          'to':   { opacity: '1', transform: 'translateY(0)'   },
        },
        'spin-y': {
          '0%':   { transform: 'rotateY(0deg)'   },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'slideUp': {
          'from': { transform: 'translateY(100%)', opacity: '0' },
          'to':   { transform: 'translateY(0)',    opacity: '1' },
        },
        'fadeInDown': {
          'from': { transform: 'translateY(-6px)', opacity: '0' },
          'to':   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'tps-page-in': 'tps-page-in 160ms cubic-bezier(0.23,1,0.32,1) both',
        'spin-y':      'spin-y 8s linear infinite',
        'slide-up':    'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
        'fade-in-down':'fadeInDown 0.2s cubic-bezier(0.23,1,0.32,1)',
      },
    },
  },
  plugins: [],
};

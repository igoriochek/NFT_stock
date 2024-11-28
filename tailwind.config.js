/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        'full-width': '100vw',
      },
      colors: {
        primary: '#1a1a1d',
        accent: '#c3073f',
        button: '#950740',
        input: '#6f2232',
    },
    fontFamily: {
      sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
    },
  },
  },
  plugins: [],
};

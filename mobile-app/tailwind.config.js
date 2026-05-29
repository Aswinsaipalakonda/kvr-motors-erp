/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brandGreen: '#04a700',
        brandRed: '#d71d22',
        neutralBg: '#f8fafc',
      },
    },
  },
  plugins: [],
}

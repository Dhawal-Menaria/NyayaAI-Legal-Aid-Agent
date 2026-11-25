/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          800: "#0f172a",
          900: "#0a0f1e",
        },
      },
    },
  },
  plugins: [],
}

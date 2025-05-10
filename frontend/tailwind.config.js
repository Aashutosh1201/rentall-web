/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          100: "#EBF5FF",
          500: "#3B82F6",
          600: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};

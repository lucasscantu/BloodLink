/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7fe",
          500: "#3b5fe0",
          600: "#2f4bc4",
          700: "#26399c",
          900: "#101d47",
        },
      },
    },
  },
  plugins: [],
};

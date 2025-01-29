/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "selector",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
      },
      colors: {
        darkPrimary: "#1A1C21",
        darkSecondary: "#292c33",
        darkNavPrimary: "#121317",
        darkNavSecondary: "#292C33",
        navPrimary: "#10141f",
        navSecondary: "#1e2538",
        border: "#444444b3",
      },
    },
  },
  plugins: [],
};

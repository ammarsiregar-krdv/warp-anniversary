/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#07070f", cosmos: "#0d0d1a", nebula: "#13131f",
        "star-3": "#7aa2d4", "star-4": "#c39bd3", "star-5": "#C8A96E", gold: "#f1c40f",
      },
      fontFamily: { cinzel: ["'Cinzel'", "serif"], raleway: ["'Raleway'", "sans-serif"] },
    },
  },
  plugins: [],
};

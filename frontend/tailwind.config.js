import path from "node:path";
import { fileURLToPath } from "node:url";
import daisyui from "daisyui";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{js,jsx}"),
  ],
  theme: {
    extend: {
      colors: { forest: "#244d3d", lime: "#d2f36b", cream: "#f5f7f2" },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Outfit", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Plus Jakarta Sans", "Outfit", "sans-serif"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: { themes: ["light", "dark"] },
};

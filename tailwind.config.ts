import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5048e5",
        brand: {
          100: "#dcfce7",
          500: "#22c55e",
          700: "#15803d"
        }
      }
    }
  },
  plugins: []
};

export default config;

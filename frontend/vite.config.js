import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/leaflet/") || id.includes("/react-leaflet/")) return "maps";
          if (id.includes("/framer-motion/")) return "motion";
          if (id.includes("/@tanstack/")) return "query";
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3320",
      "/uploads": "http://localhost:3320",
      "/socket.io": { target: "http://localhost:3320", ws: true },
    },
  },
});

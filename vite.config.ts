import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(), // dynamic import avoids externalize-deps issue
    (await import("@tailwindcss/vite")).default(),
  ],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/frontend"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));

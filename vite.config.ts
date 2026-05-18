import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // No proxy needed for Appwrite Cloud
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

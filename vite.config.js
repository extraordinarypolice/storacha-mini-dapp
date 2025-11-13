import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Must include base for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: "/storacha-mini-dapp/", // 👈 this must match your repo name exactly
});

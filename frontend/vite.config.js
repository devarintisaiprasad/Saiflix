import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Requests starting with /api are forwarded to the backend on port 5100
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:5100" } },
});

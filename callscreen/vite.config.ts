import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: false, // falls back to the next free port if 5180 is taken
    open: true,        // opens the browser on start
  },
});

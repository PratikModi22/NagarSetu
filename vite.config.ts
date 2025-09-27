import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Do not pre-bundle `ethers` during dev -- we use dynamic imports at runtime.
    exclude: ["ethers"],
  },
  build: {
    rollupOptions: {
      // Prevent Rollup from trying to resolve/bundle `ethers` during SSR/build on platforms
      // where it causes resolution failures (e.g. Vercel). We dynamically import it at runtime.
      external: ["ethers"],
    },
  },
}));

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
  // Note: we do not externalize `ethers` here because the app dynamically imports it
  // at runtime; letting Vite bundle it ensures the browser can resolve the module.
}));

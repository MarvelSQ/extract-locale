import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: __dirname,
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
  build: {
    outDir: "../dist",
  },
  plugins: [react()],
  define: {
    process: {
      env: {},
    },
    Buffer: {
      isBuffer: () => false,
    },
  },
});

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
    "process.platform": "browser",
    "process.env.BABEL_TYPES_8_BREAKING": false,
    "Buffer.isBuffer": "() => false",
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  build: {
    sourcemap: true,
    outDir: "../dist",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  plugins: [
    {
      enforce: "pre",
      transform(src, id) {
        /**
         * This is a workaround for the issue described here:
         * inside chalk, the ansi-styles package required, but it is not ready to assign
         * causing read property of undefined error.
         */
        if (id === "chalk" || id.includes("chalk/")) {
          return {
            code: "export default {}",
            map: null,
          };
        }
      },
    },
    react(),
  ],
  define: {
    "process.platform": '""',
    "process.env.BABEL_TYPES_8_BREAKING": false,
    "Buffer.isBuffer": "() => false",
  },
});

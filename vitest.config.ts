// import { defineConfig } from "vitest/config";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";

// export default defineConfig({
//   plugins: [react()],
//   test: {
//     environment: "jsdom",
//     globals: true,
//     setupFiles: ["./src/test/setup.ts"],
//     include: ["src/**/*.{test,spec}.{ts,tsx}"],
//   },
//   resolve: {
//     alias: { "@": path.resolve(__dirname, "./src") },
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
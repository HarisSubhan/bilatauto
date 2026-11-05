import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Builds a static single-page app into dist/client.
// The Node.js backend serves it and answers /api requests.
export default defineConfig({
  server: { port: 5173, proxy: { "/api": "http://localhost:4000" } },
  plugins: [
    tsConfigPaths(),
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
    tailwindcss(),
  ],
});

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const targetUrl = (env.VITE_API_BASE_URL || "http://localhost:5006/api").replace(/\/api$/, "");

  return {
    plugins: [react()],
    esbuild: {
      pure: mode === "production" ? ["console.log", "console.info", "console.debug"] : [],
    },
    server: {
      proxy: {
        "/api": {
          target: targetUrl,
          changeOrigin: true,
        },
        "/socket.io": {
          target: targetUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                return "vendor-core";
              }
              if (id.includes("xlsx")) {
                return "vendor-excel";
              }
              if (id.includes("react-icons")) {
                return "vendor-icons";
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  };
});

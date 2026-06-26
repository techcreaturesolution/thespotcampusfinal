import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const targetUrl = (env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api$/, "");

  return {
    plugins: [react()],
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
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                return "vendor-core";
              }
              if (id.includes("recharts") || id.includes("d3")) {
                return "vendor-charts";
              }
              if (id.includes("jspdf") || id.includes("html2canvas")) {
                return "vendor-pdf";
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

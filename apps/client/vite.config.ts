import * as path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const envPath = path.resolve(process.cwd(), "..", "..");

export default defineConfig(({ mode }) => {
  const {
    APP_URL,
    FILE_UPLOAD_SIZE_LIMIT,
    FILE_IMPORT_SIZE_LIMIT,
    DRAWIO_URL,
    CLOUD,
    SUBDOMAIN_HOST,
    COLLAB_URL,
    BILLING_TRIAL_DAYS,
    POSTHOG_HOST,
    POSTHOG_KEY,
    AI_VECTOR_DRIVER,
    BETA_PUBLIC_SPACES,
  } = loadEnv(mode, envPath, "");

  return {
    build: {
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              {
                name: "vendor-mantine",
                test: /[\\/]node_modules[\\/]@mantine[\\/]/,
              },
            ],
          },
        },
      },
    },
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version),
      "process.env": {
        AI_VECTOR_DRIVER,
        APP_URL,
        BETA_PUBLIC_SPACES,
        BILLING_TRIAL_DAYS,
        CLOUD,
        COLLAB_URL,
        DRAWIO_URL,
        FILE_IMPORT_SIZE_LIMIT,
        FILE_UPLOAD_SIZE_LIMIT,
        POSTHOG_HOST,
        POSTHOG_KEY,
        SUBDOMAIN_HOST,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      proxy: {
        "/api": {
          changeOrigin: false,
          target: APP_URL,
        },
        "/collab": {
          rewriteWsOrigin: true,
          target: APP_URL,
          ws: true,
        },
        "/socket.io": {
          rewriteWsOrigin: true,
          target: APP_URL,
          ws: true,
        },
      },
    },
  };
});

import netlify from "@astrojs/netlify/edge-functions";
import node from "@astrojs/node";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/edge";
import { defineConfig } from "astro/config";
import unocss from "unocss/astro";

import app from "./package.json" assert { type: "json" };

const envAdapter = () => {
  if (process.env.OUTPUT === "vercel") {
    return vercel();
  } else if (process.env.OUTPUT === "netlify") {
    return netlify();
  } else {
    return node({ mode: "standalone" });
  }
};

// https://astro.build/config
export default defineConfig({
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(app.version),
    },
    build: {
      chunkSizeWarningLimit: 1300,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/.pnpm/")) {
              return id.toString().split("node_modules/.pnpm/")[1].split("/")[0].toString();
            } else if (id.includes("node_modules/")) {
              return id.toString().split("node_modules/")[1].split("/")[0].toString();
            }
          },
        },
      },
    },
  },
  output: "server",
  adapter: envAdapter(),
  server: { host: true },
  integrations: [unocss(), react()],
});

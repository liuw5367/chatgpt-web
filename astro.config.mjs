import netlify from "@astrojs/netlify/edge-functions";
import node from "@astrojs/node";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/edge";
import tabler from "@iconify-json/tabler/icons.json";
import AstroPWA from "@vite-pwa/astro";
import { defineConfig } from "astro/config";
import { presetAttributify, presetIcons, presetUno, transformerVariantGroup } from "unocss";
import unocss from "unocss/astro";
import loadVersion from "vite-plugin-package-version";

import disableBlocks from "./plugins/disableBlocks";
import { APP_NAME } from "./src/constants";

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
    logLevel: "info",
    define: {
      // conflict highlight.js
      // __DATE__: `'${new Date().toISOString()}'`,
    },
    plugins: [loadVersion()],
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
  integrations: [
    unocss({
      // include: 'src/**/*.{htm,html,tsx,jsx,css,less,sass}',
      presets: [
        presetAttributify(),
        presetUno(),
        transformerVariantGroup(),
        presetIcons({
          // 添加前缀防止冲突
          prefix: "i-",
          // 选择需要的图库导入 https://icon-sets.iconify.design https://icones.js.org
          // 导入时需添加依赖库 @iconify-json/{name}
          collections: {
            // https://tabler-icons.io/
            tabler,
          },
          extraProperties: {
            display: "inline-block",
            "vertical-align": "middle",
          },
        }),
      ],
    }),
    react(),
    process.env.OUTPUT === "vercel" && disableBlocks(),
    process.env.OUTPUT === "netlify" && disableBlocks("netlify"),
    process.env.OUTPUT !== "netlify" &&
      AstroPWA({
        mode: "development",
        base: "/",
        scope: "/",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: APP_NAME,
          short_name: APP_NAME,
          theme_color: "#ffffff",
          icons: [
            {
              src: "favicon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "favicon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "favicon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/404",
          globPatterns: ["**/*.{css,js,html,svg,png,ico,txt}"],
        },
        devOptions: {
          enabled: false,
          navigateFallbackAllowlist: [/^\/404$/],
        },
      }),
  ],
});

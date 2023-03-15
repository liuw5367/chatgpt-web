import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import vercel from "@astrojs/vercel/edge";
import unocss from "unocss/astro";
import { presetUno, presetAttributify, transformerVariantGroup } from "unocss";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [
    unocss({
      // include: 'src/**/*.{htm,html,tsx,jsx,css,less,sass}',
      presets: [presetAttributify(), presetUno(), transformerVariantGroup()],
    }),
    react(),
  ],
});

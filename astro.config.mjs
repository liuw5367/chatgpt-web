import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import vercel from "@astrojs/vercel/edge";
import unocss from "unocss/astro";
import { presetUno } from "unocss";
import presetAttributify from "@unocss/preset-attributify";

// https://astro.build/config
export default defineConfig({
  integrations: [
    unocss({
      // include: 'src/**/*.{htm,html,tsx,jsx,css,less,sass}',
      presets: [presetAttributify(), presetUno()],
    }),
    react(),
  ],
  output: "server",
  adapter: vercel(),
});

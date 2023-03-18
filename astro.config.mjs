import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import vercel from "@astrojs/vercel/edge";
import unocss from "unocss/astro";
import { presetUno, presetAttributify, transformerVariantGroup, presetIcons } from "unocss";
import tabler from "@iconify-json/tabler/icons.json";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
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
            // https://icon-sets.iconify.design/ant-design/
            //  'ant-design': AntdIcons as any,
          },
          extraProperties: {
            display: "inline-block",
            "vertical-align": "middle",
          },
        }),
      ],
    }),
    react(),
  ],
});

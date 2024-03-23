import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

/**
 * https://unocss.dev/
 */
export default defineConfig({
  transformers: [
    // https://github.com/unocss/unocss/tree/main/packages/transformer-directives
    transformerDirectives(),
    // <div class="hover:(bg-gray-400 font-medium) font-(light mono)"/>
    // Will be transformed to:
    // <div class="hover:bg-gray-400 hover:font-medium font-light font-mono"/>
    transformerVariantGroup(),
  ],
  presets: [
    presetUno(),
    presetIcons({
      // 添加前缀防止冲突
      prefix: 'i-',
      cdn: 'https://esm.sh/',
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
});

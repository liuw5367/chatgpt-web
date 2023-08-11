import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

/**
 * https://uno.antfu.me 用来查询支持的属性
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
    presetAttributify(),
    presetUno(),
    presetIcons({
      // 添加前缀防止冲突
      prefix: 'i-',
      // 选择需要的图库导入 https://icon-sets.iconify.design https://icones.js.org
      // 导入时需添加依赖库 @iconify-json/{name}
      // https://tabler-icons.io/
      collections: { tabler: () => import('@iconify-json/tabler/icons.json').then((i) => i.default) },
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
});

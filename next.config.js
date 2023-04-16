const { presetAttributify, presetIcons, presetUno, transformerVariantGroup } = require('unocss');
const UnoCSS = require('@unocss/webpack').default;
const tabler = require('@iconify-json/tabler/icons.json');
const { i18n } = require('./next-i18next.config');
const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: { version },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  i18n,
  webpack: (config, context) => {
    config.plugins.push(UnoCSSPlugin());
    if (context.buildId !== 'development') {
      // * disable filesystem cache for build
      // * https://github.com/unocss/unocss/issues/419
      // * https://webpack.js.org/configuration/cache/
      config.cache = false;
    }
    return config;
  },
};

function UnoCSSPlugin() {
  return UnoCSS({
    presets: [
      presetAttributify(),
      presetUno(),
      transformerVariantGroup(),
      presetIcons({
        // 添加前缀防止冲突
        prefix: 'i-',
        // 选择需要的图库导入 https://icon-sets.iconify.design https://icones.js.org
        // 导入时需添加依赖库 @iconify-json/{name}
        // https://tabler-icons.io/
        collections: { tabler },
        extraProperties: {
          display: 'inline-block',
          'vertical-align': 'middle',
        },
      }),
    ],
  });
}

module.exports = nextConfig;

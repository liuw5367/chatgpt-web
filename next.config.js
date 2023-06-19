const UnoCSS = require('@unocss/webpack').default;
const { i18n } = require('./next-i18next.config');
const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: { version },
  reactStrictMode: true,
  i18n,
  webpack: (config, context) => {
    if (context.buildId !== 'development') {
      // * disable filesystem cache for build
      // * https://github.com/unocss/unocss/issues/419
      // * https://webpack.js.org/configuration/cache/
      config.cache = false;
    }
    // 开发时因为因为样式显示异常，所以关闭了缓存
    config.cache = false;

    config.plugins.push(UnoCSS());
    return config;
  },
};

module.exports = nextConfig;

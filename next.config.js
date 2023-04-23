const UnoCSS = require('@unocss/webpack').default;
const { i18n } = require('./next-i18next.config');
const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: { version },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  i18n,
  webpack: (config, context) => {
    config.plugins.push(UnoCSS());
    if (context.buildId !== 'development') {
      // * disable filesystem cache for build
      // * https://github.com/unocss/unocss/issues/419
      // * https://webpack.js.org/configuration/cache/
      config.cache = false;
    }
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;

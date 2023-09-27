const UnoCSS = require('@unocss/webpack').default;
const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: { version },
  reactStrictMode: true,
  transpilePackages: ['ahooks'],
  webpack: (config, context) => {
    if (context.buildId !== 'development') {
      // * disable filesystem cache for build
      // * https://github.com/unocss/unocss/issues/419
      // * https://webpack.js.org/configuration/cache/
      config.cache = false;
    }
    config.plugins.push(UnoCSS());
    return config;
  },
};

module.exports = nextConfig;

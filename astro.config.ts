import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';
import { defineConfig } from 'astro/config';
import unocss from 'unocss/astro';

import app from './package.json';

const envAdapter = () => {
  if (process.env.OUTPUT === 'vercel') {
    return vercel({ edgeMiddleware: true });
  } else if (process.env.OUTPUT === 'netlify') {
    return netlify({ edgeMiddleware: true, imageCDN: false });
  } else {
    return node({ mode: 'standalone' });
  }
};

const output = () => {
  if (process.env.OUTPUT === 'vercel' || process.env.OUTPUT === 'netlify') {
    return {
      manualChunks(id: string) {
        if (id.includes('node_modules/.pnpm/')) {
          return id.toString().split('node_modules/.pnpm/')[1].split('/')[0].toString();
        } else if (id.includes('node_modules/')) {
          return id.toString().split('node_modules/')[1].split('/')[0].toString();
        }
      },
    };
  }
  return {};
};

// https://astro.build/config
export default defineConfig({
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(app.version),
    },
    build: {
      chunkSizeWarningLimit: 1300,
      rollupOptions: {
        output: output(),
      },
    },
  },
  base: '/',
  output: 'server',
  adapter: envAdapter(),
  server: { host: true },
  integrations: [unocss(), react()],
});

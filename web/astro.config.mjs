// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Keep `site` in sync with src/config/site.ts (url)
export default defineConfig({
  site: 'https://www.deardice.com',
  trailingSlash: 'ignore',
  integrations: [preact(), sitemap()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  vite: {
    plugins: [tailwindcss()],
    // The PDF engines are loaded lazily (dynamic import), so the dev server would only discover them
    // when a tool is used, re-optimize in the middle of a session and answer "504 Outdated Optimize Dep"
    // (every tool then looks broken). Listing them makes Vite pre-bundle them at startup instead.
    optimizeDeps: {
      include: ['pdf-lib', 'pdfjs-dist', 'fflate', '@pdf-lib/fontkit', 'regenerator-runtime/runtime.js'],
    },
  },
});

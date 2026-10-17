import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: SITE.name,
      short_name: SITE.name,
      description: SITE.tagline,
      start_url: '/',
      display: 'browser',
      background_color: '#ffffff',
      theme_color: SITE.themeColor,
      icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    }),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );

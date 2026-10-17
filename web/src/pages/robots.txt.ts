import type { APIRoute } from 'astro';
import { SITE, absUrl } from '@/config/site';

const AI_BOTS = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Applebot-Extended'];

export const GET: APIRoute = () => {
  const { allowIndexing, disallow, aiCrawlers } = SITE.robots;
  const lines: string[] = [];
  if (!allowIndexing) {
    lines.push('User-agent: *', 'Disallow: /');
  } else {
    lines.push('User-agent: *', 'Allow: /', ...disallow.map((p) => `Disallow: ${p}`));
    if (aiCrawlers === 'block') for (const bot of AI_BOTS) lines.push('', `User-agent: ${bot}`, 'Disallow: /');
    lines.push('', `Sitemap: ${absUrl('/sitemap-index.xml')}`);
  }
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

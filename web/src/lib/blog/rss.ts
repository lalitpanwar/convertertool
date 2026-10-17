import { SITE, absUrl } from '@/config/site';
import { postPath, postsFor } from './posts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed of one language's blog (no extra dependency) */
export async function rssResponse(lang: string): Promise<Response> {
  const t = SITE.blog[lang];
  const posts = await postsFor(lang);
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${absUrl(postPath(p))}</link>
      <guid isPermaLink="true">${absUrl(postPath(p))}</guid>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
      <description>${esc(p.data.description)}</description>
    </item>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE.name} ${t.title}`)}</title>
    <link>${absUrl(t.path)}</link>
    <description>${esc(t.description)}</description>
    <language>${lang}</language>
    <atom:link href="${absUrl(`${t.path}rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '@/config/site';

export type Post = CollectionEntry<'blog'>;

/** Folder-less slug of a post: "en/how-to-x" -> "how-to-x" */
export const slugOf = (p: Post) => p.id.split('/').pop()!.replace(/\.md$/, '');

/** Where a post lives: /blog/<slug>/ (English) or /hi/blog/<slug>/ */
export const postPath = (p: Post) => `${SITE.blog[p.data.lang].path}${slugOf(p)}/`;

/** Published posts of one language, newest first */
export async function postsFor(lang: string): Promise<Post[]> {
  const all = await getCollection('blog', (p) => p.data.lang === lang && (!p.data.draft || import.meta.env.DEV));
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** The same post in the other languages (for hreflang) */
export async function translationsOf(post: Post): Promise<Post[]> {
  const all = await getCollection('blog', (p) => p.data.translationKey === post.data.translationKey && p.data.lang !== post.data.lang && !p.data.draft);
  return all;
}

export const formatDate = (d: Date, lang: string) =>
  d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Rough reading time from the raw markdown (about 200 words a minute; Hindi counts the same) */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 200));

const clean = (t: string) =>
  t
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();

/** Question + answer pairs from lines like "**Question?** Answer text" (the FAQ section of a post) */
export function faqFromBody(body: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (const line of body.split('\n')) {
    const m = /^\*\*([^*]+[?？])\*\*\s+(.+)$/.exec(line.trim());
    if (m) out.push({ q: clean(m[1]), a: clean(m[2]) });
  }
  return out;
}

export const wordCount = (body: string) => clean(body).split(/\s+/).filter(Boolean).length;

/** "### Step 1: Title" (or "### स्टेप 1: ...") headings with the first paragraph under them, for HowTo schema */
export function stepsFromBody(body: string): { name: string; text: string }[] {
  const lines = body.split(/\r?\n/);
  const out: { name: string; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^###\s+(?:Step|स्टेप)\s*\d+\s*[:：]\s*(.+)$/.exec(lines[i].trim());
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && (lines[j].trim() === '' || lines[j].trim().startsWith('<figure'))) j++;
    out.push({ name: clean(m[1]), text: clean(lines[j] ?? '') });
  }
  return out;
}

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog posts: src/content/blog/<lang>/<slug>.md  (lang = en | hi).
 * Posts that are translations of each other share the same `translationKey`
 * (they get hreflang links and a "read in Hindi/English" link).
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    /** H1 of the post */
    title: z.string(),
    /** <title> (<= 60 chars is best) */
    seoTitle: z.string().optional(),
    /** meta description (<= 155 chars) */
    description: z.string(),
    lang: z.enum(['en', 'hi']),
    translationKey: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('Lalit Panwar'),
    keywords: z.array(z.string()).default([]),
    /** slug of the tool this post is about (shows a "Try it" box and links to it) */
    tool: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

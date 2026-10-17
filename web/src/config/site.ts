/**
 * THE one place to manage site-wide settings (name, domain, SEO defaults, social, robots).
 * BRAND NAME AND DOMAIN ARE PLACEHOLDERS (undecided). When decided: change `name` and `url` here
 * and `site` in astro.config.mjs (astro.config.mjs cannot import this file).
 */
export const SITE = {
  name: 'PDFSaathi',
  url: 'https://example.com',
  tagline: 'Free PDF tools. Fast, private, no signup.',
  privacyLine: 'Your files never leave your device.',
  defaultLocale: 'en',
  locales: ['en'] as const, // 'hi' is added in the SEO-copy phase (docs/10, docs/11)
  /** og:locale per language */
  ogLocale: { en: 'en_IN' } as Record<string, string>,
  /** browser UI colour on phones (the brand red) */
  themeColor: '#d00000',
  /** default share image (1200x630) in /public */
  ogImage: '/og-default.png',
  ogImageAlt: 'Free PDF tools that run in your browser',
  /** used when a page gives no description of its own */
  defaultDescription:
    'Convert photos to PDF, turn PDF pages into JPG, merge PDFs and create PDFs from text. Free, no signup, and your files never leave your device.',
  /** schema.org Organization */
  organization: {
    legalName: 'PDFSaathi',
    logo: '/favicon.svg',
    email: '',
    /** profile URLs (X, YouTube, GitHub...) -> Organization.sameAs */
    sameAs: [] as string[],
  },
  twitterHandle: '', // e.g. '@pdfsaathi'
  /** search engine verification tokens (leave '' until you have them) */
  verification: { google: '', bing: '' },
  /** analytics ids (used in the analytics phase) */
  analytics: { gaId: '' },
  /** robots.txt */
  robots: {
    /** set false on staging so nothing gets indexed */
    allowIndexing: true,
    disallow: [] as string[],
    /** AI crawlers: 'allow' lets them read the site, 'block' keeps them out */
    aiCrawlers: 'allow' as 'allow' | 'block',
  },
};

export type Locale = (typeof SITE.locales)[number];

/** Absolute URL for a path on this site. Pages end with "/" (same as the sitemap and astro.config trailingSlash) */
export const absUrl = (path: string) => {
  const p = /\.[a-z0-9]+$/i.test(path) || path.endsWith('/') || path.includes('#') ? path : `${path}/`;
  return new URL(p, SITE.url).toString();
};

/**
 * THE one place to manage site-wide settings (name, domain, SEO defaults, social, robots).
 * BRAND NAME AND DOMAIN ARE PLACEHOLDERS (undecided). When decided: change `name` and `url` here
 * and `site` in astro.config.mjs (astro.config.mjs cannot import this file).
 */
export const SITE = {
  name: 'DEAR DICE',
  url: 'https://www.deardice.com',
  tagline: 'Free PDF tools. Fast, private, no signup.',
  privacyLine: 'Your files never leave your device.',
  /** shown on the privacy / terms pages (leave '' until you have one: the pages then say "contact form coming soon") */
  contactEmail: '',
  /** "last updated" date of the privacy policy and terms (change it whenever you edit them) */
  legalUpdated: '2026-10-17',
  defaultLocale: 'en',
  locales: ['en', 'hi'] as const, // blog posts exist in both; tool pages are English for now (docs/10, docs/11)
  /** og:locale per language */
  ogLocale: { en: 'en_IN', hi: 'hi_IN' } as Record<string, string>,
  /** browser UI colour on phones (the brand red) */
  themeColor: '#d00000',
  /** default share image (1200x630) in /public */
  ogImage: '/og-default.png',
  ogImageAlt: 'Free PDF tools that run in your browser',
  /** used when a page gives no description of its own */
  defaultDescription:
    'Dear Dice - Convert photos to PDF, turn PDF pages into JPG, merge PDFs and create PDFs from text. Free, no signup, and your files never leave your device.',
  /** blog: one set of texts per language (posts live in src/content/blog/<lang>/) */
  blog: {
    en: { path: '/blog/', title: 'Blog', heading: 'PDF guides and tips', description: 'Simple step-by-step guides for everyday PDF problems: photos to PDF, merging files, making files smaller.' },
    hi: { path: '/hi/blog/', title: 'ब्लॉग', heading: 'PDF गाइड और टिप्स', description: 'रोज़ की PDF समस्याओं के आसान स्टेप-बाय-स्टेप गाइड: फोटो से PDF, फाइल जोड़ना, फाइल छोटी करना।' },
  } as Record<string, { path: string; title: string; heading: string; description: string }>,
  /** schema.org Organization */
  organization: {
    legalName: 'Dear Dice',
    logo: '/favicon.svg',
    email: '',
    /** profile URLs (X, YouTube, GitHub...) -> Organization.sameAs */
    sameAs: [] as string[],
  },
  twitterHandle: '', // e.g. '@deardice'
  /** search engine verification tokens (leave '' until you have them) */
  verification: { google: '', bing: '' },
  /** analytics: paste your Google Tag Manager container id here (looks like GTM-XXXXXXX). Leave '' to switch it off.
   *  When it is set, the Privacy Policy automatically mentions it. */
  analytics: { gtmId: 'GTM-PV6KNGZ9' },
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

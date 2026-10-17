import { SITE, absUrl } from '@/config/site';
import type { ToolDef } from '@/lib/tools/types';

type Json = Record<string, unknown>;
const CTX = 'https://schema.org';

export const organizationId = absUrl('/#organization');
export const websiteId = absUrl('/#website');

/** On every page: who runs the site */
export function organizationSchema(): Json {
  const o = SITE.organization;
  return {
    '@context': CTX,
    '@type': 'Organization',
    '@id': organizationId,
    name: o.legalName,
    url: SITE.url,
    logo: absUrl(o.logo),
    ...(o.sameAs.length ? { sameAs: o.sameAs } : {}),
    ...(o.email ? { contactPoint: { '@type': 'ContactPoint', email: o.email, contactType: 'customer support' } } : {}),
  };
}

export function websiteSchema(): Json {
  return {
    '@context': CTX,
    '@type': 'WebSite',
    '@id': websiteId,
    url: SITE.url,
    name: SITE.name,
    description: SITE.tagline,
    inLanguage: SITE.defaultLocale,
    publisher: { '@id': organizationId },
  };
}

export interface SchemaCrumb {
  name: string;
  path?: string;
}

export function breadcrumbSchema(crumbs: SchemaCrumb[]): Json {
  return {
    '@context': CTX,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absUrl(c.path) } : {}),
    })),
  };
}

export function webPageSchema(opts: { path: string; name: string; description: string; type?: string }): Json {
  return {
    '@context': CTX,
    '@type': opts.type ?? 'WebPage',
    '@id': absUrl(opts.path) + '#webpage',
    url: absUrl(opts.path),
    name: opts.name,
    description: opts.description,
    inLanguage: SITE.defaultLocale,
    isPartOf: { '@id': websiteId },
  };
}

/** Everything a tool page needs: page, app, how-to, FAQ, breadcrumbs */
export function toolSchemas(tool: ToolDef): Json[] {
  const path = `/${tool.slug}`;
  const url = absUrl(path);
  return [
    webPageSchema({ path, name: tool.title, description: tool.description }),
    {
      '@context': CTX,
      '@type': 'WebApplication',
      '@id': url + '#app',
      name: tool.name,
      url,
      description: tool.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      inLanguage: SITE.defaultLocale,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@id': organizationId },
    },
    {
      '@context': CTX,
      '@type': 'HowTo',
      name: tool.h1,
      description: tool.intro,
      step: tool.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: `Step ${i + 1}`, text: s })),
    },
    {
      '@context': CTX,
      '@type': 'FAQPage',
      mainEntity: tool.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: tool.name, path }]),
  ];
}

/** Home page: the list of tools */
export function toolListSchema(tools: ToolDef[]): Json {
  return {
    '@context': CTX,
    '@type': 'ItemList',
    name: `${SITE.name} tools`,
    itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: absUrl(`/${t.slug}`) })),
  };
}

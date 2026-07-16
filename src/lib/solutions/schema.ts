import type { SolutionPage } from '../types';

// Mirrors the shape the live per-service pages already emit
// (see thezyra.in src/app/ai-brand-films/page.tsx): an @graph of
// Service + FAQPage + BreadcrumbList.
//
// NEVER put a price in here. Schema is read by Google and AI answer engines even
// when nothing is visible on the page - the guards module enforces this.

const SITE = 'https://www.thezyra.in';

export function solutionUrl(slug: string): string {
  return `${SITE}/solutions/${slug}`;
}

export function buildSolutionSchema(page: SolutionPage): Record<string, unknown> {
  const url = solutionUrl(page.slug);

  const service: Record<string, unknown> = {
    '@type': 'Service',
    name: page.h1,
    description: page.metaDescription,
    provider: { '@type': 'Organization', name: 'Zyra AI Content Studio', url: SITE },
    serviceType: 'AI Video Production',
    url,
  };
  // Only claim an area when we actually have one.
  if (page.geography.trim()) service.areaServed = page.geography.trim();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      service,
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Solutions', item: `${SITE}/solutions` },
          { '@type': 'ListItem', position: 3, name: page.h1, item: url },
        ],
      },
    ],
  };
}

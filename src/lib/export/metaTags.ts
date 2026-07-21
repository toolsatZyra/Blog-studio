import type { Brief } from '../types';

export function toMetaTags(brief: Brief): string {
  const url = `https://www.thezyra.studio/blog/${brief.slug}`;
  return [
    `<title>${brief.metaTitle}</title>`,
    `<meta name="description" content="${brief.metaDescription}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${brief.metaTitle}" />`,
    `<meta property="og:description" content="${brief.metaDescription}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n');
}

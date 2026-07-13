import type { Draft } from '../types';

/** FAQPage JSON-LD from the draft's FAQ. Returns '' when there are no Q&As. */
export function toFaqSchema(draft: Draft): string {
  if (!draft.faq.length) return '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: draft.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return JSON.stringify(schema, null, 2);
}

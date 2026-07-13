import type { Draft, Brief, Inputs, BlogPostObject } from '../types';

const CATEGORY_BY_GOAL: Record<string, string> = {
  awareness: 'Industry',
  'lead generation': 'Performance',
  'thought leadership': 'Industry',
  comparison: 'Playbook',
  educational: 'Playbook',
};

/** Build the thezyra.in `BlogPost` object. `today` is injectable for stable tests. */
export function toBlogPost(
  draft: Draft, brief: Brief, inputs: Inputs, today: Date = new Date(),
): BlogPostObject {
  const body: BlogPostObject['body'] = [];
  for (const b of draft.blocks) {
    switch (b.type) {
      case 'h2': body.push({ type: 'h2', text: b.text ?? '' }); break;
      case 'h3': body.push({ type: 'h3', text: b.text ?? '' }); break;
      case 'blockquote': body.push({ type: 'blockquote', text: b.text ?? '' }); break;
      case 'ul':
      case 'ol':
        body.push({ type: 'p', text: (b.items ?? []).map((i) => `• ${i}`).join('  ') });
        break;
      case 'table':
        if (b.table) {
          const summary = b.table.rows.map((r) => r.join(' — ')).join('; ');
          body.push({ type: 'p', text: `${b.table.headers.join(' vs ')}: ${summary}` });
        }
        break;
      default:
        if (b.text) body.push({ type: 'p', text: b.text });
    }
  }
  // Fold FAQ into the body as an H2 + Q/A (site has no FAQ block type).
  if (draft.faq.length) {
    body.push({ type: 'h2', text: 'FAQ' });
    for (const f of draft.faq) {
      body.push({ type: 'h3', text: f.q });
      body.push({ type: 'p', text: f.a });
    }
  }

  const wpm = 200;
  const readTime = `${Math.max(1, Math.ceil(draft.wordCount / wpm))} min read`;
  const month = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const excerpt = (brief.metaDescription || body.find((x) => x.type === 'p')?.text || '').slice(0, 160);

  return {
    slug: brief.slug,
    title: brief.recommendedTitle,
    excerpt,
    body,
    date: month,
    readTime,
    category: CATEGORY_BY_GOAL[inputs.goal] ?? 'Industry',
    poster: '/posters/REPLACE-ME.webp',
  };
}

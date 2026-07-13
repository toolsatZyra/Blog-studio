import type { Draft, Brief } from '../types';

export function toMarkdown(draft: Draft, brief: Brief): string {
  const out: string[] = [`# ${brief.recommendedTitle}`, ''];
  for (const b of draft.blocks) {
    switch (b.type) {
      case 'h2': out.push(`## ${b.text}`, ''); break;
      case 'h3': out.push(`### ${b.text}`, ''); break;
      case 'blockquote': out.push(`> ${b.text}`, ''); break;
      case 'ul': out.push(...(b.items ?? []).map((i) => `- ${i}`), ''); break;
      case 'ol': out.push(...(b.items ?? []).map((i, n) => `${n + 1}. ${i}`), ''); break;
      case 'table':
        if (b.table) {
          out.push(`| ${b.table.headers.join(' | ')} |`);
          out.push(`| ${b.table.headers.map(() => '---').join(' | ')} |`);
          out.push(...b.table.rows.map((r) => `| ${r.join(' | ')} |`), '');
        }
        break;
      default: out.push(b.text ?? '', '');
    }
  }
  if (draft.faq.length) {
    out.push('## FAQ', '');
    for (const f of draft.faq) out.push(`### ${f.q}`, '', f.a, '');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

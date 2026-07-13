import type { Draft, Brief } from '../types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toHtml(draft: Draft, brief: Brief): string {
  const out: string[] = [`<article>`, `<h1>${esc(brief.recommendedTitle)}</h1>`];
  for (const b of draft.blocks) {
    switch (b.type) {
      case 'h2': out.push(`<h2>${esc(b.text ?? '')}</h2>`); break;
      case 'h3': out.push(`<h3>${esc(b.text ?? '')}</h3>`); break;
      case 'blockquote': out.push(`<blockquote>${esc(b.text ?? '')}</blockquote>`); break;
      case 'ul': out.push(`<ul>${(b.items ?? []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`); break;
      case 'ol': out.push(`<ol>${(b.items ?? []).map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`); break;
      case 'table':
        if (b.table) {
          out.push('<table><thead><tr>' + b.table.headers.map((h) => `<th>${esc(h)}</th>`).join('') + '</tr></thead><tbody>' +
            b.table.rows.map((r) => '<tr>' + r.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') +
            '</tbody></table>');
        }
        break;
      default: out.push(`<p>${esc(b.text ?? '')}</p>`);
    }
  }
  if (draft.faq.length) {
    out.push('<h2>FAQ</h2>');
    for (const f of draft.faq) out.push(`<h3>${esc(f.q)}</h3>`, `<p>${esc(f.a)}</p>`);
  }
  out.push('</article>');
  return out.join('\n');
}

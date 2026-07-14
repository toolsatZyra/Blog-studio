import type { Draft, Brief, Inputs, Exports } from '../types';
import { toMarkdown } from '../export/markdown';
import { toHtml } from '../export/html';
import { toMetaTags } from '../export/metaTags';
import { toFaqSchema } from '../export/faqSchema';
import { toBlogPost } from '../export/cmsCopy';

/** Builds every export artifact from the finished draft + brief. */
export function exporter(draft: Draft, brief: Brief, inputs: Inputs, today?: Date, category?: string): Exports {
  return {
    markdown: toMarkdown(draft, brief),
    html: toHtml(draft, brief),
    metaTags: toMetaTags(brief),
    faqSchema: toFaqSchema(draft),
    briefJson: JSON.stringify(brief, null, 2),
    blogPost: toBlogPost(draft, brief, inputs, today, category),
  };
}

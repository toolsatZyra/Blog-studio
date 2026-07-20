import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseMarkdown, splitFaqSection } from '../src/lib/modules/blogGenerator.ts';

const QA = '\n\n### What does an AI brand film cost?\n\nIt depends on scope.\n';

// The writer prompt never dictates the heading text, so the model picks its own
// phrasing. Anything we fail to recognise silently loses the FAQPage JSON-LD.
test('FAQ is captured however the writer phrases the heading', () => {
  const headings = [
    '## FAQ',
    '## FAQs',
    '## Frequently Asked Questions',
    '## Frequently asked questions',
    '## Common Questions',
    '## Questions Brands Ask',
    '## Questions we get asked',
    '## People Also Ask',
  ];
  for (const h of headings) {
    const { faq } = splitFaqSection(parseMarkdown(h + QA));
    assert.equal(faq.length, 1, `heading not recognised: ${h}`);
    assert.equal(faq[0].q, 'What does an AI brand film cost?');
    assert.equal(faq[0].a, 'It depends on scope.');
  }
});

test('a heading that merely mentions questions in prose is not an FAQ section', () => {
  // "The Questions Nobody Asks About Rerolls" is an article section, not an FAQ.
  const md = '## The Questions Nobody Asks About Rerolls\n\nSome real body copy here.\n';
  const { faq, body } = splitFaqSection(parseMarkdown(md));
  assert.equal(faq.length, 0);
  assert.ok(body.length > 0, 'body content must survive');
});

test('body content is never swallowed when there is no FAQ', () => {
  const md = '## How we shoot\n\nBody one.\n\n### A sub point\n\nBody two.\n';
  const { faq, body } = splitFaqSection(parseMarkdown(md));
  assert.equal(faq.length, 0);
  assert.equal(body.length, 4);
});

test('multiple Q&A pairs are all captured', () => {
  const md = '## Frequently Asked Questions\n\n### Q one?\n\nA one.\n\n### Q two?\n\nA two.\n';
  const { faq } = splitFaqSection(parseMarkdown(md));
  assert.deepEqual(faq, [{ q: 'Q one?', a: 'A one.' }, { q: 'Q two?', a: 'A two.' }]);
});

test('a two-paragraph answer keeps both paragraphs', () => {
  // The old parser dropped every paragraph after the first, silently.
  const md = '## FAQ\n\n### Q one?\n\nFirst para.\n\nSecond para.\n';
  const { faq } = splitFaqSection(parseMarkdown(md));
  assert.equal(faq.length, 1);
  assert.equal(faq[0].a, 'First para. Second para.');
});

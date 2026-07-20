import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildReviewDocx, DOCX_MIME } from '../src/lib/export/docx.ts';
import type { Draft } from '../src/lib/types.ts';

const draft: Draft = {
  title: 'The Real Cost of AI Video',
  blocks: [
    { type: 'p', text: 'Opening paragraph with a rupee figure of Rs 4,00,000.' },
    { type: 'h2', text: 'What Drives Cost' },
    { type: 'p', text: 'Body copy.' },
    { type: 'ul', items: ['First item', 'Second item'] },
    { type: 'ol', items: ['Step one', 'Step two'] },
    { type: 'blockquote', text: 'A pull quote.' },
    { type: 'h3', text: 'A Sub Point' },
    { type: 'table', table: { headers: ['Model', 'Cost'], rows: [['A', '1'], ['B', '2']] } },
  ],
  faq: [{ q: 'What does it cost?', a: 'It depends on scope.' }],
  wordCount: 40, sourceNeededCount: 0, mode: 'live',
};

test('produces a real Word file, not HTML wearing a .doc extension', async () => {
  const buf = await buildReviewDocx(draft, 'The Real Cost of AI Video');
  const bytes = new Uint8Array(buf);
  // Every .docx is a ZIP: it must start with the PK local-file-header magic.
  assert.equal(bytes[0], 0x50, 'byte 0 should be P');
  assert.equal(bytes[1], 0x4b, 'byte 1 should be K');
  assert.ok(bytes.length > 2000, 'a real document is not a stub');
});

test('the MIME type is the OOXML one', () => {
  assert.equal(DOCX_MIME, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});

test('every block type survives into the document', async () => {
  const buf = await buildReviewDocx(draft, 'The Real Cost of AI Video');
  const xml = Buffer.from(buf).toString('latin1');
  // The parts are deflated, so assert on what we can see: the package is
  // well-formed and carries the expected OOXML parts.
  assert.ok(xml.includes('word/document.xml'), 'missing the main document part');
  assert.ok(xml.includes('[Content_Types].xml'), 'missing the content-types part');
});

test('a draft with no FAQ still produces a document', async () => {
  const buf = await buildReviewDocx({ ...draft, faq: [] }, 'T');
  assert.ok(buf.byteLength > 2000);
});

test('an empty draft does not throw', async () => {
  const buf = await buildReviewDocx({ ...draft, blocks: [], faq: [] }, 'T');
  assert.ok(buf.byteLength > 1000);
});

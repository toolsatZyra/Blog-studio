import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toDoc, DOC_MIME } from '../src/lib/export/doc.ts';

const html = '<article><h1>My Title</h1><p>Hello world.</p><h2>FAQ</h2><h3>Q?</h3><p>A.</p></article>';

test('the document is a complete, openable HTML file', () => {
  const doc = toDoc(html, 'My Title');
  assert.match(doc, /^<!DOCTYPE html>/);
  assert.match(doc, /<html[^>]*xmlns:w="urn:schemas-microsoft-com:office:word"/, 'Word needs its namespace');
  assert.match(doc, /<meta charset="utf-8">/, 'without this, rupee and accented characters mangle');
  assert.match(doc, /<\/html>$/);
});

test('the article content is carried through intact', () => {
  const doc = toDoc(html, 'My Title');
  assert.ok(doc.includes('Hello world.'));
  assert.ok(doc.includes('<h3>Q?</h3>'), 'the FAQ must survive - it is what a reviewer checks');
});

test('the title becomes the document title', () => {
  assert.match(toDoc(html, 'My Title'), /<title>My Title<\/title>/);
});

test('a title with markup characters is escaped, not injected', () => {
  const doc = toDoc(html, 'Cost & Value <of> AI');
  assert.match(doc, /<title>Cost &amp; Value &lt;of&gt; AI<\/title>/);
});

test('the MIME type is the one Word and Google Docs expect', () => {
  assert.equal(DOC_MIME, 'application/msword');
});

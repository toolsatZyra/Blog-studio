import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLooseJson, extractJsonObject } from '../src/lib/solutions/parseJson.ts';

test('clean JSON parses with no repairs', () => {
  const r = parseLooseJson<{ a: string }>('{"a":"b"}');
  assert.equal(r.value.a, 'b');
  assert.deepEqual(r.repaired, []);
});

test('strips a code fence', () => {
  assert.equal(extractJsonObject('```json\n{"a":1}\n```'), '{"a":1}');
});

test('ignores chatter around the object', () => {
  const r = parseLooseJson<{ a: number }>('Sure! Here you go:\n{"a":1}\nHope that helps.');
  assert.equal(r.value.a, 1);
});

test('REGRESSION: the exact failure seen in the studio - unescaped quotes inside a value', () => {
  // "Expected ',' or ']' after array element" — a stray quote ended the string
  // early, so the parser saw two adjacent elements.
  const bad = `{"faq":[{"q":"Do you work with fintech?","a":"Yes. We made "Service Launch" for Cars24."}]}`;
  assert.throws(() => JSON.parse(bad), 'precondition: raw JSON.parse must fail');
  const r = parseLooseJson<{ faq: { q: string; a: string }[] }>(bad);
  assert.equal(r.value.faq.length, 1);
  assert.equal(r.value.faq[0].a, 'Yes. We made "Service Launch" for Cars24.');
  assert.ok(r.repaired.includes('stray-quotes'));
});

test('repairs raw newlines inside strings', () => {
  const bad = '{"a":"line one\nline two"}';
  assert.throws(() => JSON.parse(bad));
  const r = parseLooseJson<{ a: string }>(bad);
  assert.match(r.value.a, /line one/);
  assert.ok(r.repaired.includes('control-chars-in-strings'));
});

test('repairs trailing commas', () => {
  const r = parseLooseJson<{ a: number[] }>('{"a":[1,2,],}');
  assert.deepEqual(r.value.a, [1, 2]);
});

test('repairs a missing comma between array elements', () => {
  const bad = '{"problemBody":[\n"para one."\n"para two."\n]}';
  const r = parseLooseJson<{ problemBody: string[] }>(bad);
  assert.equal(r.value.problemBody.length, 2);
});

test('does NOT corrupt legitimate escaped quotes', () => {
  const r = parseLooseJson<{ a: string }>('{"a":"he said \\"hi\\" to me"}');
  assert.equal(r.value.a, 'he said "hi" to me');
  assert.deepEqual(r.repaired, []);
});

test('does NOT corrupt apostrophes or punctuation', () => {
  const r = parseLooseJson<{ a: string }>(`{"a":"Zyra's 5-7 day pipeline: fast, cheap? no."}`);
  assert.equal(r.value.a, "Zyra's 5-7 day pipeline: fast, cheap? no.");
});

test('unsalvageable JSON throws with a useful snippet, not "Unexpected token"', () => {
  assert.throws(
    () => parseLooseJson('{"a": [1,2 "b": }'),
    (e: Error) => /near:/.test(e.message),
  );
});

test('no JSON at all is reported clearly', () => {
  assert.throws(() => parseLooseJson('I cannot help with that.'), /No JSON object found/);
});

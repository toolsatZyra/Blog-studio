import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSolutionSlug, uniqueSlug, buildH1, buildEyebrow, servicePhrase, UMBRELLA_SERVICE,
} from '../src/lib/solutions/naming.ts';
import { deliveryTimeFor } from '../src/lib/solutions/delivery.ts';
import { proofDisclaimer } from '../src/lib/solutions/disclaimer.ts';
import { buildSolutionSchema, solutionUrl } from '../src/lib/solutions/schema.ts';
import { findGuardHits, explainGuardHits } from '../src/lib/solutions/guards.ts';
import { SERVICE_CATALOG, CASE_STUDY_CATALOG, PROOF_LIMIT } from '../src/lib/solutionsData.ts';
import type { SolutionInputs, SolutionPage } from '../src/lib/types.ts';

const base: SolutionInputs = {
  industry: 'Fintech',
  geography: 'Bengaluru',
  serviceSlugs: ['ai-brand-films'],
  caseStudySlugs: ['cars24'],
  cta: 'Schedule a Call',
};

// ── catalog ─────────────────────────────────────────────────────────────────

test('catalog mirrors the real site: 5 services, 22 case studies, no metrics', () => {
  assert.equal(SERVICE_CATALOG.length, 5);
  assert.equal(CASE_STUDY_CATALOG.length, 22);
  assert.equal(PROOF_LIMIT, 3);
  for (const c of CASE_STUDY_CATALOG) {
    assert.ok(c.cfStream, `${c.slug} is missing a Cloudflare stream id`);
    assert.ok(!/\d+\s*%|\b\d+x\b/i.test(c.brief), `${c.slug} brief looks like it states a metric`);
  }
});

// ── naming ──────────────────────────────────────────────────────────────────

test('slug: service + industry + geography', () => {
  assert.equal(buildSolutionSlug(base), 'ai-brand-films-for-fintech-brands-in-bengaluru');
});

test('slug: industry only / geography only', () => {
  assert.equal(buildSolutionSlug({ ...base, geography: '' }), 'ai-brand-films-for-fintech-brands');
  assert.equal(buildSolutionSlug({ ...base, industry: '' }), 'ai-brand-films-in-bengaluru');
});

test('slug: no service falls back to the umbrella', () => {
  assert.equal(
    buildSolutionSlug({ ...base, serviceSlugs: [] }),
    'ai-content-production-for-fintech-brands-in-bengaluru',
  );
});

test('slug: several services read as the umbrella, not a list', () => {
  assert.equal(
    buildSolutionSlug({ ...base, serviceSlugs: ['ai-brand-films', 'social-media-content'] }),
    'ai-content-production-for-fintech-brands-in-bengaluru',
  );
});

test('slug: keeps the connective words util.slugify would strip', () => {
  const s = buildSolutionSlug(base);
  assert.match(s, /-for-/);
  assert.match(s, /-in-/);
});

test('slug: messy free-text is folded, not rejected', () => {
  assert.equal(
    buildSolutionSlug({ ...base, industry: 'D2C  &  Beauty!', geography: 'Delhi NCR' }),
    'ai-brand-films-for-d2c-and-beauty-brands-in-delhi-ncr',
  );
});

test('uniqueSlug: appends a numeric suffix on collision', () => {
  assert.equal(uniqueSlug('a-b', []), 'a-b');
  assert.equal(uniqueSlug('a-b', ['a-b']), 'a-b-2');
  assert.equal(uniqueSlug('a-b', ['a-b', 'a-b-2']), 'a-b-3');
});

test('H1: single service keeps "Brands"; umbrella drops it', () => {
  // Derived from the service SLUG, not its catalog title ("AI Brand Films &
  // Commercials"), so this matches the approved H1 exactly.
  assert.equal(buildH1(base), 'AI Brand Films for Fintech Brands in Bengaluru');
  assert.equal(
    buildH1({ ...base, serviceSlugs: [] }),
    'AI Content Production for Fintech in Bengaluru',
  );
});

test('H1/slug: acronyms survive for every real service', () => {
  const expected: Record<string, string> = {
    'ott-production': 'OTT Production',
    'ai-brand-films': 'AI Brand Films',
    'micro-drama-production': 'Micro Drama Production',
    'ai-ad-creatives': 'AI Ad Creatives',
    'social-media-content': 'Social Media Content',
  };
  for (const [slug, phrase] of Object.entries(expected)) {
    assert.equal(servicePhrase([slug]), phrase, `phrase for ${slug}`);
    assert.equal(buildSolutionSlug({ ...base, serviceSlugs: [slug] }), `${slug}-for-fintech-brands-in-bengaluru`);
  }
});

test('H1: geography only', () => {
  assert.equal(buildH1({ ...base, industry: '', serviceSlugs: [] }), 'AI Content Production in Bengaluru');
});

test('eyebrow: drops the service segment when none is selected', () => {
  assert.equal(buildEyebrow(base), 'AI Brand Films · Fintech · Bengaluru');
  assert.equal(buildEyebrow({ ...base, serviceSlugs: [] }), 'Fintech · Bengaluru');
});

test('servicePhrase: unknown slugs do not leak into copy', () => {
  assert.equal(servicePhrase(['not-a-service']), UMBRELLA_SERVICE);
});

// ── delivery ────────────────────────────────────────────────────────────────

test('deliveryTimeFor: one service uses that service phrase', () => {
  assert.equal(deliveryTimeFor(['ai-brand-films']), '5-7 days');
  assert.equal(deliveryTimeFor(['ai-ad-creatives']), 'about a day');
  assert.equal(deliveryTimeFor(['social-media-content']), 'about a day');
  assert.equal(deliveryTimeFor(['micro-drama-production']), 'about five days');
});

test('deliveryTimeFor: OTT keeps its own long timeline, never the fast rule', () => {
  assert.equal(deliveryTimeFor(['ott-production']), '8-10 weeks');
});

test('deliveryTimeFor: mixed formats state the range, never one number', () => {
  const out = deliveryTimeFor(['ai-brand-films', 'social-media-content']);
  assert.match(out, /about a day/);
  assert.match(out, /5-7 days/);
});

test('deliveryTimeFor: none selected uses the same range phrasing', () => {
  assert.equal(deliveryTimeFor([]), deliveryTimeFor(['ai-brand-films', 'social-media-content']));
});

test('deliveryTimeFor: an unknown slug is ignored, not guessed', () => {
  assert.equal(deliveryTimeFor(['ai-brand-films', 'nope']), '5-7 days');
});

// ── disclaimer ──────────────────────────────────────────────────────────────

test('proofDisclaimer: both inputs', () => {
  assert.equal(
    proofDisclaimer('fintech', 'Bengaluru'),
    "Selected from Zyra's full body of work. Not all projects shown are fintech or Bengaluru-based - each links to its full case study.",
  );
});

test('proofDisclaimer: industry only stays grammatical', () => {
  assert.equal(
    proofDisclaimer('fintech', ''),
    "Selected from Zyra's full body of work. Not all projects shown are fintech - each links to its full case study.",
  );
});

test('proofDisclaimer: geography only stays grammatical', () => {
  assert.equal(
    proofDisclaimer('', 'Bengaluru'),
    "Selected from Zyra's full body of work. Not all projects shown are Bengaluru-based - each links to its full case study.",
  );
});

test('proofDisclaimer: never emits a dangling "or"', () => {
  for (const [i, g] of [['fintech', ''], ['', 'Bengaluru'], ['fintech', 'Bengaluru']]) {
    assert.ok(!/\bare or\b|\bor -/.test(proofDisclaimer(i, g)));
  }
});

// ── guards ──────────────────────────────────────────────────────────────────

test('guards: catch every money form, including the industry figure', () => {
  for (const bad of ['costs ₹60,000', 'from ₹30–80L', 'about Rs 5 lakh', '2 crore budget', 'INR 40000', '$1,200']) {
    const hits = findGuardHits({ copy: bad });
    assert.ok(hits.some((h) => h.rule === 'money'), `should flag money in: ${bad}`);
  }
});

test('guards: allow time copy that merely looks numeric', () => {
  for (const ok of ['delivered in 5-7 days', 'about five days', '8-10 weeks', '50+ brand films created']) {
    const hits = findGuardHits({ copy: ok });
    assert.deepEqual(hits, [], `should NOT flag: ${ok}`);
  }
});

test('guards: catch fabricated metrics', () => {
  assert.ok(findGuardHits({ copy: 'drove 3x ROI' }).some((h) => h.rule === 'fabricated-metric'));
  assert.ok(findGuardHits({ copy: 'a 40% lift' }).some((h) => h.rule === 'fabricated-metric'));
});

test('guards: catch placeholders', () => {
  assert.ok(findGuardHits({ copy: 'x [source needed]' }).some((h) => h.rule === 'placeholder'));
  assert.ok(findGuardHits({ copy: '{{h1}}' }).some((h) => h.rule === 'placeholder'));
});

test('guards: explain hits in plain English naming the field', () => {
  const msgs = explainGuardHits(findGuardHits({ aeoAnswer: 'a fraction of the ₹30–80L' }));
  assert.equal(msgs.length, 1);
  assert.match(msgs[0], /aeoAnswer/);
  assert.match(msgs[0], /no price and no industry cost figure/);
});

// ── schema ──────────────────────────────────────────────────────────────────

const page: SolutionPage = {
  slug: 'ai-brand-films-for-fintech-brands-in-bengaluru',
  industry: 'Fintech',
  geography: 'Bengaluru',
  serviceSlugs: ['ai-brand-films'],
  metaTitle: 'AI Brand Films for Fintech Brands in Bengaluru | Zyra',
  metaDescription: 'Cinematic AI brand films for fintech companies in Bengaluru, delivered in five to seven days.',
  eyebrow: 'AI Brand Films · Fintech · Bengaluru',
  h1: 'AI Brand Films for Fintech Brands in Bengaluru',
  subline: 'Cinematic brand stories at the speed of culture - produced in days, not quarters.',
  trustLine: '50+ brand films and ads created · 5-7 day delivery',
  aeoAnswer: 'Zyra is an AI-native film studio producing brand films for fintech companies in Bengaluru.',
  problemHeading: 'Fintech moves faster than film.',
  problemBody: ['a', 'b', 'c'],
  deliverables: [{ num: '01', title: 'Concept', desc: 'Story and script.' }],
  proof: [{
    workSlug: 'cars24', client: 'Cars24', title: 'Service Launch', category: 'Brand Film',
    year: '2025', tags: ['Brand Film'], brief: 'An ad campaign for Cars24.',
    cfStream: '466b01620c29279a0a63ee1e451fe59c', vertical: false,
  }],
  process: [{ num: '01', title: 'Brief', desc: 'We agree the story.' }],
  faq: [{ q: 'How long does a fintech brand film take?', a: 'Five to seven days from approved brief.' }],
  mode: 'live',
};

test('schema: Service, FAQPage and BreadcrumbList, in that order', () => {
  const g = buildSolutionSchema(page)['@graph'] as Record<string, unknown>[];
  assert.deepEqual(g.map((n) => n['@type']), ['Service', 'FAQPage', 'BreadcrumbList']);
});

test('schema: areaServed present only when geography is set', () => {
  const withGeo = (buildSolutionSchema(page)['@graph'] as Record<string, unknown>[])[0];
  assert.equal(withGeo.areaServed, 'Bengaluru');

  const noGeo = (buildSolutionSchema({ ...page, geography: '' })['@graph'] as Record<string, unknown>[])[0];
  assert.ok(!('areaServed' in noGeo), 'areaServed must be absent, not empty');
});

test('schema: FAQPage carries every FAQ verbatim', () => {
  const faqNode = (buildSolutionSchema(page)['@graph'] as Record<string, unknown>[])[1];
  const entries = faqNode.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
  assert.equal(entries.length, page.faq.length);
  assert.equal(entries[0].name, page.faq[0].q);
  assert.equal(entries[0].acceptedAnswer.text, page.faq[0].a);
});

test('schema: urls match the slug', () => {
  const g = buildSolutionSchema(page)['@graph'] as Record<string, unknown>[];
  assert.equal(g[0].url, solutionUrl(page.slug));
  const crumbs = g[2].itemListElement as { item: string }[];
  assert.equal(crumbs[2].item, solutionUrl(page.slug));
});

test('REGRESSION: a price in the FAQ reaches the JSON-LD, and the guard catches it', () => {
  // The near-miss this whole rule exists for: invisible on the page, but shipped
  // to Google and AI answer engines.
  const leaky = { ...page, faq: [{ q: 'What does it cost?', a: 'Typically ₹30–80L.' }] };
  const json = JSON.stringify(buildSolutionSchema(leaky));
  assert.match(json, /₹30–80L/, 'schema does carry FAQ text verbatim');
  assert.ok(
    findGuardHits({ schema: json }).some((h) => h.rule === 'money'),
    'the guard must refuse to publish it',
  );
});

test('a clean page passes every guard, schema included', () => {
  const json = JSON.stringify(buildSolutionSchema(page));
  const fields: Record<string, string> = {
    metaTitle: page.metaTitle, metaDescription: page.metaDescription,
    h1: page.h1, subline: page.subline, trustLine: page.trustLine,
    aeoAnswer: page.aeoAnswer, schema: json,
  };
  assert.deepEqual(findGuardHits(fields), []);
});

// ── generator (mock path — no LLM) ──────────────────────────────────────────

import { solutionGenerator, resolveProof } from '../src/lib/modules/solutionGenerator.ts';

test('resolveProof: caps at 3, keeps selection order, first is featured', () => {
  const p = resolveProof(['swiggy', 'cars24', 'goodscore', 'meesho', 'rabitat']);
  assert.equal(p.length, PROOF_LIMIT);
  assert.deepEqual(p.map((x) => x.workSlug), ['swiggy', 'cars24', 'goodscore']);
});

test('resolveProof: unknown slugs are dropped, not faked', () => {
  assert.deepEqual(resolveProof(['cars24', 'not-a-project']).map((p) => p.workSlug), ['cars24']);
});

test('resolveProof: carries real fields and no metrics field exists', () => {
  const [p] = resolveProof(['cars24']);
  assert.equal(p.client, 'Cars24');
  assert.equal(p.cfStream, '466b01620c29279a0a63ee1e451fe59c');
  assert.ok(!('metrics' in p) && !('results' in p));
});

test('generator: refuses without a segment or without proof', async () => {
  await assert.rejects(
    () => solutionGenerator({ industry: '', geography: '', serviceSlugs: [], caseStudySlugs: ['cars24'], cta: 'x' }),
    /industry or a geography/,
  );
  await assert.rejects(
    () => solutionGenerator({ industry: 'Fintech', geography: '', serviceSlugs: [], caseStudySlugs: [], cta: 'x' }),
    /at least one case study/,
  );
});

test('generator: derives naming and grounds deliverables/process in real data', async () => {
  const { page } = await solutionGenerator({
    industry: 'Fintech', geography: 'Bengaluru',
    serviceSlugs: ['ai-brand-films'], caseStudySlugs: ['cars24'], cta: 'Schedule a Call',
  });
  assert.equal(page.slug, 'ai-brand-films-for-fintech-brands-in-bengaluru');
  assert.equal(page.h1, 'AI Brand Films for Fintech Brands in Bengaluru');
  assert.equal(page.deliverables.length, 6);
  assert.equal(page.process.length, 5);
  // Real deliverable from the site's own service page, not invented.
  assert.ok(page.deliverables.some((d) => d.title.includes('Hero Film')));
});

test('CONSTRAINT: a generated page mentions no money and no invented metrics', async () => {
  for (const serviceSlugs of [['ai-brand-films'], ['ott-production'], [], ['ai-ad-creatives', 'social-media-content']]) {
    const { page } = await solutionGenerator({
      industry: 'Fintech', geography: 'Bengaluru', serviceSlugs,
      caseStudySlugs: ['cars24', 'goodscore'], cta: 'Schedule a Call',
    });
    const fields: Record<string, string> = {
      metaTitle: page.metaTitle, metaDescription: page.metaDescription,
      subline: page.subline, trustLine: page.trustLine, aeoAnswer: page.aeoAnswer,
      problemHeading: page.problemHeading,
      body: page.problemBody.join(' '),
      faq: page.faq.map((f) => `${f.q} ${f.a}`).join(' '),
      schema: JSON.stringify(buildSolutionSchema(page)),
    };
    assert.deepEqual(findGuardHits(fields), [], `guards must pass for services=[${serviceSlugs}]`);
  }
});

test('CONSTRAINT: the delivery time on the page matches the service rule', async () => {
  const ott = await solutionGenerator({
    industry: 'Fintech', geography: '', serviceSlugs: ['ott-production'],
    caseStudySlugs: ['cars24'], cta: 'x',
  });
  assert.match(ott.page.trustLine, /8-10 weeks/);
  assert.ok(!/5-7 days|about a day/.test(ott.page.trustLine), 'OTT must not inherit the fast rule');

  const vertical = await solutionGenerator({
    industry: 'D2C', geography: '', serviceSlugs: ['social-media-content'],
    caseStudySlugs: ['cars24'], cta: 'x',
  });
  assert.match(vertical.page.trustLine, /about a day/);
});

test('CONSTRAINT: proof never claims to be from the page industry/geo', async () => {
  const { page } = await solutionGenerator({
    industry: 'Fintech', geography: 'Bengaluru', serviceSlugs: ['ai-brand-films'],
    caseStudySlugs: ['cars24', 'swiggy'], cta: 'x',
  });
  const proofText = page.proof.map((p) => `${p.client} ${p.title} ${p.brief}`).join(' ');
  assert.ok(!/fintech/i.test(proofText), 'Cars24/Swiggy are not fintech; copy must not say so');
  assert.ok(!/bengaluru/i.test(proofText));
});

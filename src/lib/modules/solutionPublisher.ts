import type { SolutionPage } from '../types';
import { env, isLive } from '../config';

// Opens a PR on thezyra.studio that appends a generated SolutionPage to lp-data.ts.
// Never commits to the default branch - always a branch + PR the team reviews,
// exactly like the blog flow. Nothing reaches the live site without a merge.

const GH = 'https://api.github.com';

function ghHeaders() {
  return {
    authorization: `Bearer ${env.publish.token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'content-type': 'application/json',
    'user-agent': 'programmatic-seo',
  };
}

async function gh(path: string, init?: RequestInit) {
  const res = await fetch(`${GH}${path}`, { ...init, headers: ghHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

const s = (v: string) => JSON.stringify(v);

/** Serialize a SolutionPage as a valid TS object literal (JSON strings are valid TS). */
export function serializeSolutionPage(page: SolutionPage): string {
  const lines: string[] = ['  {'];
  lines.push(`    slug: ${s(page.slug)},`);
  lines.push(`    industry: ${s(page.industry)},`);
  lines.push(`    geography: ${s(page.geography)},`);
  lines.push(`    serviceSlugs: [${page.serviceSlugs.map(s).join(', ')}],`);
  lines.push('');
  lines.push(`    metaTitle: ${s(page.metaTitle)},`);
  lines.push(`    metaDescription: ${s(page.metaDescription)},`);
  lines.push('');
  lines.push(`    eyebrow: ${s(page.eyebrow)},`);
  lines.push(`    h1: ${s(page.h1)},`);
  lines.push(`    subline: ${s(page.subline)},`);
  lines.push(`    trustLine: ${s(page.trustLine)},`);
  lines.push(`    aeoAnswer:\n      ${s(page.aeoAnswer)},`);
  lines.push('');
  lines.push(`    problemHeading: ${s(page.problemHeading)},`);
  lines.push('    problemBody: [');
  for (const p of page.problemBody) lines.push(`      ${s(p)},`);
  lines.push('    ],');
  lines.push('');
  lines.push('    deliverables: [');
  for (const d of page.deliverables) {
    lines.push(`      { num: ${s(d.num)}, title: ${s(d.title)}, desc: ${s(d.desc)} },`);
  }
  lines.push('    ],');
  lines.push('');
  lines.push('    // First entry is the FEATURED tile in the contact sheet.');
  lines.push('    proof: [');
  for (const p of page.proof) {
    lines.push('      {');
    lines.push(`        workSlug: ${s(p.workSlug)}, client: ${s(p.client)}, title: ${s(p.title)},`);
    lines.push(`        category: ${s(p.category)}, year: ${s(p.year)}, tags: [${p.tags.map(s).join(', ')}],`);
    lines.push(`        brief:\n          ${s(p.brief)},`);
    lines.push(`        cfStream: ${s(p.cfStream)}, vertical: ${p.vertical},`);
    lines.push('      },');
  }
  lines.push('    ],');
  lines.push('');
  lines.push('    process: [');
  for (const p of page.process) {
    lines.push(`      { num: ${s(p.num)}, title: ${s(p.title)}, desc: ${s(p.desc)} },`);
  }
  lines.push('    ],');
  lines.push('');
  lines.push('    faq: [');
  for (const f of page.faq) {
    lines.push('      {');
    lines.push(`        q: ${s(f.q)},`);
    lines.push(`        a:\n          ${s(f.a)},`);
    lines.push('      },');
  }
  lines.push('    ],');
  lines.push('  },');
  return lines.join('\n');
}

/** Insert the literal as the first element of ALL_SOLUTIONS (newest first). */
export function insertIntoLpData(fileContent: string, literal: string): string {
  const open = /(export const ALL_SOLUTIONS:\s*SolutionPage\[\]\s*=\s*\[)/;
  if (!open.test(fileContent)) {
    throw new Error(
      'Could not find the ALL_SOLUTIONS array in lp-data.ts. Does the site have the /solutions route yet?',
    );
  }

  // An empty array is written `= []`, so its brackets share a line. Inserting
  // after the `[` welded the new entry to the closing one as `},]` - valid, but
  // it shows up in the PR diff of the first publish after the array is emptied
  // and reads as a mistake. Close it on its own line instead.
  const empty = /(export const ALL_SOLUTIONS:\s*SolutionPage\[\]\s*=\s*\[)(\s*)(\])/;
  if (empty.test(fileContent)) return fileContent.replace(empty, `$1\n${literal}\n$3`);

  return fileContent.replace(open, `$1\n${literal}`);
}

/** Every slug already published, so a new page can never silently overwrite one. */
export function existingSlugs(fileContent: string): string[] {
  return [...fileContent.matchAll(/^\s{4}slug:\s*'([^']+)'|^\s{4}slug:\s*"([^"]+)"/gm)]
    .map((m) => m[1] ?? m[2])
    .filter(Boolean);
}

export interface SolutionPublishResult {
  prUrl: string;
  prNumber: number;
  branch: string;
  slug: string;
  renamed: boolean; // true when the slug collided and was de-duplicated
}

/**
 * Full flow: read lp-data.ts on the base branch -> de-duplicate the slug ->
 * insert -> new branch -> commit -> open PR.
 *
 * @param nonce keeps branch names unique; the caller supplies it so this module
 *   stays free of Date.now() and remains testable.
 */
export async function publishSolutionToGitHub(
  page: SolutionPage,
  nonce: string,
  uniqueSlug: (base: string, taken: string[]) => string,
): Promise<SolutionPublishResult> {
  if (!isLive.publish()) {
    throw new Error('Publishing is not configured. Set GITHUB_TOKEN (and optionally PUBLISH_REPO) in .env.');
  }
  const { repo, baseBranch, lpDataPath } = env.publish;

  // 1. base branch head
  const baseRef = await gh(`/repos/${repo}/git/ref/heads/${baseBranch}`);
  const baseSha: string = baseRef.object.sha;

  // 2. current lp-data.ts
  let file: { content: string; sha: string };
  try {
    file = await gh(`/repos/${repo}/contents/${encodeURIComponent(lpDataPath)}?ref=${baseBranch}`);
  } catch (e) {
    throw new Error(
      `${lpDataPath} does not exist on ${repo}@${baseBranch} yet. ` +
      'Merge the /solutions route to the site first, then publish. ' +
      `(${(e as Error).message})`,
    );
  }
  const current = Buffer.from(file.content, 'base64').toString('utf8');

  // 3. never clobber a live page: de-duplicate the slug against what is published
  const taken = existingSlugs(current);
  const slug = uniqueSlug(page.slug, taken);
  const renamed = slug !== page.slug;
  const finalPage: SolutionPage = renamed ? { ...page, slug } : page;

  // 4. insert
  const updated = insertIntoLpData(current, serializeSolutionPage(finalPage));
  if (updated === current) throw new Error('Insertion produced no change.');

  // 5. branch
  const branch = `solutions/${slug}-${nonce}`.slice(0, 240);
  await gh(`/repos/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });

  // 6. commit
  await gh(`/repos/${repo}/contents/${encodeURIComponent(lpDataPath)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `solutions: add ${finalPage.h1}`,
      content: Buffer.from(updated, 'utf8').toString('base64'),
      sha: file.sha,
      branch,
    }),
  });

  // 7. PR — never a direct commit to the default branch
  const renameNote = renamed
    ? `\n\n⚠️ **Slug renamed** to \`${slug}\` — \`${page.slug}\` is already published.`
    : '';
  const pr = await gh(`/repos/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Solutions: ${finalPage.h1}`,
      head: branch,
      base: baseBranch,
      body:
        `Adds a programmatic landing page to \`${lpDataPath}\` via Zyra Studio.\n\n` +
        `- **URL:** \`/solutions/${slug}\`\n` +
        `- **Industry:** ${finalPage.industry || '—'}\n` +
        `- **Geography:** ${finalPage.geography || '—'}\n` +
        `- **Services:** ${finalPage.serviceSlugs.join(', ') || 'all (umbrella)'}\n` +
        `- **Proof:** ${finalPage.proof.map((p) => p.client).join(', ')}\n\n` +
        'Checked before this PR was opened: no price or cost figure anywhere (copy or JSON-LD), ' +
        'no invented metrics, and the proof disclaimer is present.\n\n' +
        `Review the copy and merge to publish at \`/solutions/${slug}\`.${renameNote}`,
    }),
  });

  return { prUrl: pr.html_url, prNumber: pr.number, branch, slug, renamed };
}

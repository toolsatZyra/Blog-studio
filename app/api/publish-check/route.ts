import { NextResponse } from 'next/server';
import { env, isLive } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Read-only debug endpoint: verifies the GITHUB_TOKEN can actually do the publish
// flow — token identity, repo access + push permission, base branch exists, and
// blog-data.ts is readable with the ALL_POSTS insert anchor. Mutates nothing (no
// branch, no commit, no PR). Mirrors /api/serp-check, /api/x-check.
const GH = 'https://api.github.com';

function headers() {
  return {
    authorization: `Bearer ${env.publish.token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'programmatic-seo',
  };
}

async function gh(path: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${GH}${path}`, { headers: headers() });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 200); }
  return { ok: res.ok, status: res.status, data };
}

export async function POST() {
  if (!isLive.publish()) {
    return NextResponse.json({ configured: false, note: 'Set GITHUB_TOKEN in .env, then restart the server.' });
  }
  const { repo, baseBranch, blogDataPath } = env.publish;
  const checks: Record<string, unknown> = { repo, baseBranch, blogDataPath };
  try {
    // 1. token identity
    const me = await gh('/user');
    checks.tokenUser = me.ok ? (me.data as { login?: string }).login : `error ${me.status}`;
    if (!me.ok) return NextResponse.json({ configured: true, ok: false, stage: 'token', ...checks, error: me.data });

    // 2. repo access + push permission
    const r = await gh(`/repos/${repo}`);
    if (!r.ok) return NextResponse.json({ configured: true, ok: false, stage: 'repo', ...checks, error: r.data });
    const perms = (r.data as { permissions?: Record<string, boolean> }).permissions ?? {};
    checks.canPush = !!perms.push;

    // 3. base branch exists
    const ref = await gh(`/repos/${repo}/git/ref/heads/${baseBranch}`);
    checks.baseBranchExists = ref.ok;
    if (!ref.ok) return NextResponse.json({ configured: true, ok: false, stage: 'baseBranch', ...checks, error: ref.data });

    // 4. blog-data.ts readable + has the ALL_POSTS anchor
    const file = await gh(`/repos/${repo}/contents/${encodeURIComponent(blogDataPath)}?ref=${baseBranch}`);
    if (!file.ok) return NextResponse.json({ configured: true, ok: false, stage: 'blogData', ...checks, error: file.data });
    const content = Buffer.from((file.data as { content: string }).content, 'base64').toString('utf8');
    const hasAnchor = /export const ALL_POSTS:\s*BlogPost\[\]\s*=\s*\[/.test(content);
    checks.blogDataHasAnchor = hasAnchor;
    checks.blogDataBytes = content.length;

    const ok = !!checks.canPush && hasAnchor;
    return NextResponse.json({
      configured: true, ok, ...checks,
      note: ok
        ? 'Ready to publish — token can push and the insert anchor is present.'
        : !checks.canPush
          ? 'Token lacks push permission on the repo — grant Contents: Read and write + Pull requests: Read and write.'
          : 'ALL_POSTS anchor not found in blog-data.ts — the file structure may have changed.',
    });
  } catch (e) {
    return NextResponse.json({ configured: true, ok: false, ...checks, error: (e as Error).message.slice(0, 400) });
  }
}

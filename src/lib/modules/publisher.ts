import type { BlogPostObject } from '../types';
import { env, isLive } from '../config';

// Opens a PR on the thezyra.in repo that appends the generated BlogPost to
// src/lib/blog-data.ts. Never commits to the default branch — always a PR the
// team reviews and merges. Requires a GitHub token with repo access.

const GH = 'https://api.github.com';

function ghHeaders() {
  return {
    authorization: `Bearer ${env.publish.token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'content-type': 'application/json',
    'user-agent': 'zyra-blog-studio',
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

/** Serialize a BlogPost as a valid TS object literal (JSON string values are valid TS). */
export function serializeBlogPost(post: BlogPostObject): string {
  const s = (v: string) => JSON.stringify(v);
  const bodyLines = post.body
    .map((b) => `      { type: ${s(b.type)}, text: ${s(b.text)} },`)
    .join('\n');
  return [
    '  {',
    `    slug: ${s(post.slug)},`,
    `    title: ${s(post.title)},`,
    `    excerpt: ${s(post.excerpt)},`,
    `    date: ${s(post.date)},`,
    `    readTime: ${s(post.readTime)},`,
    `    category: ${s(post.category)},`,
    `    poster: ${s(post.poster)},`,
    '    body: [',
    bodyLines,
    '    ],',
    '  },',
  ].join('\n');
}

/** Insert the literal as the first element of the ALL_POSTS array (newest first). */
export function insertIntoBlogData(fileContent: string, literal: string): string {
  const re = /(export const ALL_POSTS:\s*BlogPost\[\]\s*=\s*\[)/;
  if (!re.test(fileContent)) {
    throw new Error('Could not find the ALL_POSTS array in blog-data.ts — the file structure may have changed.');
  }
  return fileContent.replace(re, `$1\n${literal}`);
}

export interface PublishResult {
  prUrl: string;
  prNumber: number;
  branch: string;
  slug: string;
}

/** Full flow: read blog-data.ts on the base branch → insert → new branch → commit → PR. */
export async function publishToGitHub(post: BlogPostObject, nonce: string): Promise<PublishResult> {
  if (!isLive.publish()) {
    throw new Error('Publishing is not configured. Set GITHUB_TOKEN (and optionally PUBLISH_REPO) in .env.');
  }
  const { repo, baseBranch, blogDataPath } = env.publish;

  // 1. base branch head sha
  const baseRef = await gh(`/repos/${repo}/git/ref/heads/${baseBranch}`);
  const baseSha: string = baseRef.object.sha;

  // 2. current blog-data.ts (content + blob sha)
  const file = await gh(`/repos/${repo}/contents/${encodeURIComponent(blogDataPath)}?ref=${baseBranch}`);
  const current = Buffer.from(file.content, 'base64').toString('utf8');

  // 3. insert the new post
  const updated = insertIntoBlogData(current, serializeBlogPost(post));
  if (updated === current) throw new Error('Insertion produced no change.');

  // 4. create a branch
  const branch = `blog/${post.slug}-${nonce}`.slice(0, 240);
  await gh(`/repos/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });

  // 5. commit the updated file to the branch
  await gh(`/repos/${repo}/contents/${encodeURIComponent(blogDataPath)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `blog: add "${post.title}"`,
      content: Buffer.from(updated, 'utf8').toString('base64'),
      sha: file.sha,
      branch,
    }),
  });

  // 6. open the PR
  const posterNote = post.poster.includes('REPLACE-ME')
    ? '\n\n⚠️ **Poster placeholder** — replace `' + post.poster + '` with a real hero image before merging.'
    : '';
  const pr = await gh(`/repos/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Blog: ${post.title}`,
      head: branch,
      base: baseBranch,
      body:
        `Adds a new post to \`${blogDataPath}\` via Zyra Blog Studio.\n\n` +
        `- **Slug:** \`${post.slug}\`\n- **Category:** ${post.category}\n- **Read time:** ${post.readTime}\n\n` +
        `Review the copy, swap the poster image, and merge to publish at \`/blog/${post.slug}\`.${posterNote}`,
    }),
  });

  return { prUrl: pr.html_url, prNumber: pr.number, branch, slug: post.slug };
}

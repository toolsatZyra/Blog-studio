import { NextRequest, NextResponse } from 'next/server';
import { publishToGitHub } from '@/lib/modules/publisher';
import { isLive } from '@/lib/config';
import type { BlogPostObject } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!isLive.publish()) {
      return NextResponse.json(
        { error: 'Publishing not configured. Add GITHUB_TOKEN (repo access) to .env, then restart.' },
        { status: 400 },
      );
    }
    const { blogPost, nonce } = (await req.json()) as { blogPost: BlogPostObject; nonce?: string };
    if (!blogPost?.slug || !blogPost.body?.length) {
      return NextResponse.json({ error: 'A generated BlogPost (with body) is required.' }, { status: 400 });
    }
    // nonce keeps branch names unique; caller supplies one (avoids Date in the module).
    const result = await publishToGitHub(blogPost, nonce || String(Date.now()));
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

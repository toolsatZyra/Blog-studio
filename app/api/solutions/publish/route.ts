import { NextRequest, NextResponse } from 'next/server';
import { publishSolutionToGitHub } from '@/lib/modules/solutionPublisher';
import { findGuardHits, explainGuardHits, auditFields } from '@/lib/solutions/guards';
import { uniqueSlug } from '@/lib/solutions/naming';
import { isLive } from '@/lib/config';
import type { SolutionPage } from '@/lib/types';

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

    const { page, nonce } = (await req.json()) as { page: SolutionPage; nonce?: string };

    if (!page?.slug || !page.h1 || !page.proof?.length) {
      return NextResponse.json(
        { error: 'A generated page (with a slug and at least one case study) is required.' },
        { status: 400 },
      );
    }

    // Server-side gate. The UI shows these too, but this is the line that
    // actually stops a bad page becoming a PR - a price in the FAQ reaches
    // Google via JSON-LD while staying invisible on the page.
    const blockers = explainGuardHits(findGuardHits(auditFields(page)));
    if (blockers.length) {
      return NextResponse.json(
        { error: 'Publishing blocked — regenerate and try again.', blockers },
        { status: 400 },
      );
    }

    const result = await publishSolutionToGitHub(page, nonce || String(Date.now()), uniqueSlug);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

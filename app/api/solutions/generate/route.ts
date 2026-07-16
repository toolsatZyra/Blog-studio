import { NextRequest, NextResponse } from 'next/server';
import { solutionGenerator } from '@/lib/modules/solutionGenerator';
import { buildSolutionSchema } from '@/lib/solutions/schema';
import { findGuardHits, explainGuardHits, auditFields } from '@/lib/solutions/guards';
import type { SolutionInputs } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const inputs = (await req.json()) as SolutionInputs;

    if (!inputs?.industry?.trim() && !inputs?.geography?.trim()) {
      return NextResponse.json(
        { error: 'Give an industry or a geography — at least one is required.' },
        { status: 400 },
      );
    }
    if (!inputs?.caseStudySlugs?.length) {
      return NextResponse.json(
        { error: 'Pick at least one case study — the page needs real proof.' },
        { status: 400 },
      );
    }

    const { page, warnings } = await solutionGenerator(inputs);

    // The guards are the enforcement, not the prompt. Report rather than reject:
    // the operator sees exactly what is wrong and can regenerate. Publishing is
    // what gets blocked.
    const blockers = explainGuardHits(findGuardHits(auditFields(page)));

    return NextResponse.json({
      page,
      schema: JSON.stringify(buildSolutionSchema(page), null, 2),
      warnings,
      blockers,
      publishable: blockers.length === 0,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

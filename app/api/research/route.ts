import { NextRequest, NextResponse } from 'next/server';
import { runResearch } from '@/lib/pipeline';
import type { Inputs } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const inputs = (await req.json()) as Inputs;
    if (!inputs?.topic?.trim()) {
      return NextResponse.json({ error: 'A blog topic / seed idea is required.' }, { status: 400 });
    }
    const result = await runResearch(inputs);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

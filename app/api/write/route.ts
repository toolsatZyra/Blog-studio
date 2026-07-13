import { NextRequest, NextResponse } from 'next/server';
import { runWriting } from '@/lib/pipeline';
import type { Inputs, Research, TopicCandidate } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { inputs, research, selected } = (await req.json()) as {
      inputs: Inputs; research: Research; selected: TopicCandidate;
    };
    if (!inputs || !research || !selected) {
      return NextResponse.json({ error: 'inputs, research, and selected topic are required.' }, { status: 400 });
    }
    const result = await runWriting(inputs, research, selected);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

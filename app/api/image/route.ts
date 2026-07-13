import { NextRequest, NextResponse } from 'next/server';
import { imageGenerator, type ImageInput } from '@/lib/modules/imageGenerator';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as ImageInput;
    if (!input?.title || !input?.slug) {
      return NextResponse.json({ error: 'title and slug are required.' }, { status: 400 });
    }
    const heroImage = await imageGenerator(input);
    return NextResponse.json({ heroImage });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

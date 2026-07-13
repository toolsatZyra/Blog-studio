import { NextResponse } from 'next/server';
import { accessPreflight } from '@/lib/modules/accessPreflight';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST() {
  try {
    const preflight = await accessPreflight();
    return NextResponse.json({ preflight });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

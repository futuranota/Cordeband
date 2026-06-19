import { NextResponse } from 'next/server';
import { getInstrumentDetectionMode } from '@/lib/instrument-detection';

export async function GET() {
  return NextResponse.json({ detectionMode: getInstrumentDetectionMode() });
}

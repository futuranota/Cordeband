import { NextResponse } from 'next/server';
import { finalizeUserSongUpload } from '@/lib/songs/user-upload';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await finalizeUserSongUpload(id);

  if ('error' in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}

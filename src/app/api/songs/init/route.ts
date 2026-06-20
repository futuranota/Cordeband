import { NextResponse } from 'next/server';
import {
  createUserSongUploadSession,
  parseUserSongUploadJson,
} from '@/lib/songs/user-upload';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = parseUserSongUploadJson(body);
  if (!input) {
    return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 });
  }

  const result = await createUserSongUploadSession(input);
  if ('error' in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}

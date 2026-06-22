import { timingSafeEqual } from 'node:crypto';

export function authorizeProcessorCallback(request: Request): boolean {
  const expected = process.env.PROCESSOR_CALLBACK_TOKEN?.trim();
  if (!expected) return false;
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const provided = match[1].trim();
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

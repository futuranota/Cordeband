import { NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/admin-auth';
import { ADMIN_RATE_LIMIT, checkRateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin(request?: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (request) {
    const path = new URL(request.url).pathname;
    const result = checkRateLimit(`admin:${user.id}:${path}`, ADMIN_RATE_LIMIT);
    if (!result.ok) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } },
        ),
      };
    }
  }

  return { user, error: null };
}

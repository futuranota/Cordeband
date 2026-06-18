import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export function getAdminUserId(): string | null {
  return process.env.ADMIN_USER_ID?.trim() || null;
}

export function isAdminUser(userId: string | undefined | null): boolean {
  const adminId = getAdminUserId();
  return !!adminId && !!userId && userId === adminId;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, error: null };
}

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/songs|api/admin/featured-songs|api/admin/businesses|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

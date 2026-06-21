import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getProfile, getPostAuthRedirect } from '@/lib/supabase/profile';

const ALLOWED_NEXT = new Set(['/reset-password', '/dashboard', '/profile', '/studio']);

function sanitizeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  const path = raw.startsWith('/') ? raw.split('?')[0] : `/${raw.split('?')[0]}`;
  return ALLOWED_NEXT.has(path) ? path : '/dashboard';
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = sanitizeNext(searchParams.get('next'));
  const isRecovery = next === '/reset-password';

  if (!code) {
    if (isRecovery) {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  let redirectPath = next;
  let response = NextResponse.redirect(`${origin}${redirectPath}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.redirect(`${origin}${redirectPath}`);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (isRecovery) {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user && redirectPath !== '/reset-password') {
    const profile = await getProfile(supabase, user.id);
    if (redirectPath === '/dashboard' || redirectPath === '/studio') {
      redirectPath = getPostAuthRedirect(profile);
    } else if (getPostAuthRedirect(profile) === '/profile') {
      redirectPath = '/profile';
    }
  }

  if (redirectPath !== next) {
    const updated = NextResponse.redirect(`${origin}${redirectPath}`);
    response.cookies.getAll().forEach((cookie) => {
      updated.cookies.set(cookie.name, cookie.value);
    });
    return updated;
  }

  return response;
}

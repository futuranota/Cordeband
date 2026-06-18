# Supabase Auth — URL configuration

Required for password reset, email confirmation, and OAuth on **cordeband.site**.

## Dashboard: Authentication → URL Configuration

| Field | Value |
|-------|--------|
| **Site URL** | `https://cordeband.site` |
| **Redirect URLs** | `https://cordeband.site/auth/callback` |
| | `https://cordeband.site/reset-password` |

Local development (optional):

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/reset-password`

## Password reset flow

1. User submits email on `/forgot-password`
2. Email link → Supabase verify → `https://cordeband.site/auth/callback?code=...&next=/reset-password`
3. Callback exchanges code, sets session cookies, redirects to `/reset-password`
4. User sets new password on `/reset-password`

If redirect URLs are missing, Supabase falls back to Site URL and recovery breaks (often lands on `/login`).

## Env

Set in Vercel and `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://cordeband.site
```

Used by [`ForgotPasswordForm.tsx`](../src/components/auth/ForgotPasswordForm.tsx) for `redirectTo`.

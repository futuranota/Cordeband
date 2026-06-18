# Supabase Auth — URL configuration

Required for password reset, email confirmation, and OAuth on **cordeband.site**.

## Dashboard: Authentication → URL Configuration

| Field | Value |
|-------|--------|
| **Site URL** | `https://cordeband.site` |
| **Redirect URLs** | `https://cordeband.site/auth/callback` |
| | `https://cordeband.site/auth/recovery` |
| | `https://cordeband.site/reset-password` |

Local development (optional):

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/recovery`
- `http://localhost:3000/reset-password`

## Password reset flow

1. User submits email on `/forgot-password`
2. Email link → Supabase verify → `https://cordeband.site/auth/recovery?code=...`
3. User clicks **Continuar para restablecer contraseña** (token is not consumed on page load — anti email prefetch)
4. Client exchanges code → redirect to `/reset-password`
5. User sets new password on `/reset-password`

OAuth and email confirmation still use `/auth/callback`.

If redirect URLs are missing, Supabase falls back to Site URL and recovery breaks.

## Env

Set in Vercel and `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://cordeband.site
```

Used by [`ForgotPasswordForm.tsx`](../src/components/auth/ForgotPasswordForm.tsx) for `redirectTo`.

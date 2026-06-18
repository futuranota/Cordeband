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
2. `resetPasswordForEmail` uses `redirectTo`:  
   `https://cordeband.site/auth/callback?next=/reset-password`
3. Email link → Supabase verify → callback exchanges `code` → sets session cookies
4. Callback redirects to `/reset-password`
5. `/reset-password` reads session (no token in URL) and calls `updateUser({ password })`

Use the default Supabase **Reset password** email template with `{{ .ConfirmationURL }}` (redirect_to must include the callback URL above).

OAuth and email signup confirmation also use `/auth/callback`.

## Env

```env
NEXT_PUBLIC_APP_URL=https://cordeband.site
```

Used by [`ForgotPasswordForm.tsx`](../src/components/auth/ForgotPasswordForm.tsx) for `redirectTo`.

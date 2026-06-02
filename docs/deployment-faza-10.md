# Faza 10 — Production deployment runbook

Checklist for moving Gallebo from local/staging to production on Vercel with live Stripe, Resend, OAuth, and analytics.

## 1. Vercel project

1. Connect the GitHub repo to Vercel (or link an existing project).
2. **Production branch:** `main` (or your release branch).
3. **Framework:** Next.js (auto-detected).
4. **Region:** prefer EU (`fra1` / `cdg1`) for Adriatic/EU users.
5. Enable **Preview Deployments** for every Pull Request (default).
6. Enable **Vercel Analytics** and **Speed Insights** in Project → Analytics.

### Custom domain

1. Vercel → Project → Settings → Domains.
2. Add `gallebo.app` (and optionally `www.gallebo.app`, `gallebo.eu`).
3. Configure DNS per Vercel instructions (A/CNAME records).
4. SSL is automatic once DNS propagates.

## 2. Vercel environment variables

Copy from [`.env.vercel.example`](../.env.vercel.example). Set for **Production** (and Preview if needed).

| Variable | Production action |
|----------|-------------------|
| `NEXT_PUBLIC_APP_URL` | `https://gallebo.app` (or your chosen domain) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never expose to client |
| `STRIPE_SECRET_KEY` | **Live** key `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Live** key `pk_live_...` (optional until client Stripe.js) |
| `STRIPE_WEBHOOK_SECRET` | Optional on Vercel (primary consumer is Edge Function) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` (EU cloud) |
| `VAPID_SUBJECT` | `mailto:hello@gallebo.app` (verified domain) |
| All other vars | Same as staging/local where applicable |

After changing env vars, **redeploy** production.

## 3. Supabase Auth (OAuth + redirects)

1. Supabase Dashboard → **Authentication → URL Configuration**.
2. **Site URL:** `https://gallebo.app`
3. **Redirect URLs:** include:
   - `https://gallebo.app/auth/callback`
   - `https://www.gallebo.app/auth/callback`
   - `http://localhost:3000/auth/callback` (local dev)
4. **Authentication → Providers:**
   - Enable **Google** — add OAuth client ID/secret from Google Cloud Console.
   - Enable **Apple** — add Apple Services ID, team ID, key ID, private key.
5. Email/password remains enabled; existing users are unaffected.

Local `supabase/config.toml` lists the same redirect URLs for parity.

## 4. Stripe (live)

Webhook is handled by Supabase Edge Function (not Next.js):

```
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

### Checklist

- [ ] Stripe Dashboard → switch to **Live mode**
- [ ] Copy **live** `sk_live_` → Vercel `STRIPE_SECRET_KEY` + Supabase Secret `STRIPE_SECRET_KEY`
- [ ] Copy **live** `pk_live_` → Vercel `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Developers → Webhooks → **Add endpoint** (live) with the Edge Function URL above
- [ ] Select events already handled by `stripe-webhook` (checkout, connect, etc.)
- [ ] Copy new **live** `whsec_` → Supabase Secret `STRIPE_WEBHOOK_SECRET`
- [ ] Test a small live payment + Connect Express pilot onboarding (`/pilot/stripe`)

## 5. Supabase Edge Function secrets

Set via Dashboard → Edge Functions → Secrets or:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_... --project-ref <ref>
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref <ref>
npx supabase secrets set RESEND_API_KEY=re_... --project-ref <ref>
npx supabase secrets set VAPID_SUBJECT=mailto:hello@gallebo.app --project-ref <ref>
```

See [`.env.supabase.example`](../.env.supabase.example) for the full list.

## 6. Resend (email)

- [ ] Resend Dashboard → **Domains** → add `gallebo.app`
- [ ] Add DNS records (SPF, DKIM) and verify
- [ ] Update Supabase Auth SMTP to use Resend (if not already)
- [ ] Set `RESEND_API_KEY` in Supabase Secrets
- [ ] Smoke-test: signup confirmation, booking notification, verification emails

## 7. PostHog

1. Create project at [posthog.com](https://posthog.com) (EU region recommended).
2. Copy project API key → `NEXT_PUBLIC_POSTHOG_KEY` on Vercel.
3. Define funnels in PostHog for events emitted by the app:
   - `registration`
   - `verification_complete`
   - `booking_created`
   - `flight_completed`
4. Admin in-app summary: `/admin/analytics` (Supabase aggregates).

## 8. SEO & performance verification

After deploy:

- [ ] `https://gallebo.app/sitemap.xml` loads
- [ ] `https://gallebo.app/robots.txt` loads
- [ ] Open Graph debugger on a flight detail URL
- [ ] Vercel Speed Insights shows LCP/CLS
- [ ] Optional: run Lighthouse on `/` and `/flights`

## 9. Post-deploy smoke test

1. Register with email/password
2. Log in with Google OAuth
3. Search flights, open detail page
4. Request booking (verified passenger)
5. Pilot: complete Stripe Connect onboarding (live)
6. Complete a test flight flow end-to-end

---

*i18n (next-intl, HR/IT/SI) is deferred to a separate phase — English-only UI remains until then.*

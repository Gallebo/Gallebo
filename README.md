# Gallebo — Flight Sharing Platform

European marketplace for legal EASA cost-sharing between private pilots and passengers.

**Phase 0:** Project setup, Supabase/MapLibre/Didit wiring, landing shell UI.

**Phase 1:** Email/password auth, user status system, role onboarding (Passenger/Pilot/Airfield), Didit KYC, admin verification queue, document uploads, pilot expiry cron skeleton, GDPR account deletion.

## Prerequisites

- Node.js 20+
- npm
- Accounts (partial setup OK): [Supabase](https://supabase.com), [MapTiler](https://www.maptiler.com), [Didit](https://didit.me)

## Local setup

```bash
cd gallebo
npm install
cp .env.example .env.local
# Fill in .env.local (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Dev utilities: [http://localhost:3000/dev](http://localhost:3000/dev).

## Environment variables

| Variable | Required (Faza 0) | Notes |
|----------|-------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; never expose to client |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Yes | MapLibre tiles in browser |
| `DIDIT_API_KEY` | Yes (Faza 1) | Server-only KYC API |
| `DIDIT_WEBHOOK_SECRET` | Yes (Faza 1) | Webhook HMAC verification |
| `DIDIT_WORKFLOW_ID` | Yes (Faza 1) | Didit workflow ID |
| `NEXT_PUBLIC_APP_URL` | Yes (Faza 1) | e.g. `http://localhost:3000` |
| `CRON_SECRET` | Yes (Faza 1) | Bearer token for `/api/cron/*` |
| `PHONE_ENCRYPTION_KEY` | Recommended | Min 32 chars; encrypts phone at rest |

## Phase 1 — Auth email templates (Supabase Dashboard)

Under **Authentication → Email Templates**, customize (English):

- **Confirm signup** — welcome copy + confirm link
- **Reset password** — reset link pointing to `{NEXT_PUBLIC_APP_URL}/reset-password`

## Phase 1 — First admin user

After registering, run in Supabase SQL editor:

```sql
UPDATE public.profiles
SET role = 'admin', status = 'verified'
WHERE id = '<your-auth-user-uuid>';
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Project structure

- `app/(public)/` — Public routes (SEO)
- `app/(auth)/` — Auth routes (Faza 1)
- `app/(dashboard)/` — Dashboard, settings, onboarding, admin (Faza 1)
- `supabase/migrations/` — Database schema + RLS
- `components/marketing/` — Landing UI
- `lib/supabase/` — Supabase clients
- `docs/design-references/` — UI reference screenshots

## Supabase types

When the database schema exists:

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

## Documentation

Product and phase specs: `../files/` in the Flight folder.

## Git branching

- `main` — stable
- `develop` — integration
- `feature/*` — feature work

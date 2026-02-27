# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MassageMatch Thailand is a React 18 + TypeScript + Vite SPA for finding massage therapists in Thailand. It uses Supabase (Auth, DB, Edge Functions) and Stripe for payments. Styling is CSS Modules (no Tailwind).

### Quick reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run test` | Run vitest unit tests |
| `npm run lint` | ESLint (see note below) |

### Known issues

- **ESLint not installed**: `npm run lint` fails because `eslint` is not in `devDependencies` and no ESLint config file exists. This is a pre-existing gap in the repo.
- **auth.test.tsx fails**: The `auth.test.tsx` test fails due to a missing `HelmetProvider` wrapper around the `Login` component under test. This is a pre-existing test issue (10/11 tests pass).

### Environment

- The app requires a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at minimum. Copy `.env.example` to `.env` and fill in real Supabase credentials to enable backend features.
- Without real Supabase credentials, the frontend UI renders fully but auth/data operations will fail gracefully.
- Stripe price IDs, VAPID keys, and PostHog keys are optional and only needed for their respective features.

### Dev server

- `npm run dev -- --host 0.0.0.0` exposes the server on all interfaces (useful in cloud VMs).
- The default route redirects unauthenticated users to `/login`.
- Public pages accessible without auth: `/login`, `/top`, `/contact`, `/faq`, `/pricing`, `/:city` (city pages).

### Supabase Edge Functions

Located in `supabase/functions/`. These are Deno-based and require the Supabase CLI + Docker to serve locally (`supabase functions serve`). They are not needed for basic frontend development.

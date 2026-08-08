# Thanh Việt

A Vietnamese-learning web app (Duolingo-style lessons + a live pronunciation
"Tone Tuner") built for a specific congregation's study group. See the full
product spec for vision, phased roadmap, and data model.

## Stack

- **Next.js (App Router) + TypeScript** — web/PWA client
- **Tailwind CSS** — styling
- **Supabase** — Postgres, Auth, Storage, Row-Level Security
- **TanStack Query** — server-state fetching/caching
- **Zustand** — local/UI state
- **Vercel** — hosting

The Python/FastAPI audio-analysis service for the Tone Tuner (Praat-Parselmouth
pitch tracking) is a separate service, built in a later phase.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` and fill in values from your Supabase
project (**Project Settings → API**):

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for the
  browser; access is enforced by Postgres RLS, not by hiding these.
- `SUPABASE_SECRET_KEY` — **server-only**. Bypasses RLS. Never prefix with
  `NEXT_PUBLIC_`, never import into a Client Component.

`.env.local` is gitignored. For deployed environments (e.g. Vercel), set the
same three variables in the project's Environment Variables settings.

### Database schema

The schema + Row-Level Security policies live in
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
Run it once against a fresh Supabase project via **SQL Editor → New query**
in the Supabase dashboard. Future schema changes should be added as new
numbered files in `supabase/migrations/`.

### Project structure

```
src/
  app/
    login/, signup/        — auth screens
    auth/callback/          — handles Supabase email-confirmation redirects
    dashboard/               — minimal protected page (proves auth + RLS work)
    providers.tsx            — TanStack Query provider
  lib/supabase/
    client.ts                — browser client (anon key)
    server.ts                — server client (anon key, cookie-based session)
    server-admin.ts          — service-role client, server-only, bypasses RLS
    middleware.ts             — session-refresh logic used by src/proxy.ts
    types.ts                  — hand-written Database types (see file header)
  proxy.ts                   — Next.js Proxy (formerly "middleware"): refreshes
                                the auth session and gates protected routes
supabase/
  migrations/                — SQL schema + RLS, run manually for now
```

## Deploying

Import the repo at [vercel.com/new](https://vercel.com/new), set the three
Supabase environment variables above in the Vercel project settings, and
deploy. No other configuration is required.

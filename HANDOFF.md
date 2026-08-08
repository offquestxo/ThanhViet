# Handoff — Thanh Việt

Status snapshot for picking this project back up in a new session. Read
[`/Users/jason/Downloads/ThanhViet.md`](/Users/jason/Downloads/ThanhViet.md)
(the full product spec) first if it's still at that path — everything below
assumes that context.

## Where things stand

Phase 1 MVP, just started. Scaffolding, auth, and DB schema are done and
verified end-to-end (real signup → confirmation email → login → dashboard
reading a real RLS-protected row). No lesson content, gamification, or Tone
Tuner UI exists yet.

**Not yet deployed to Vercel** — still local-only. That's the natural next
step if it hasn't happened since this was written.

## Machine quirks (read before running anything)

This laptop had **no Node, no Homebrew, no git identity, no SSH keys, no gh
CLI** when this project started, and the user wants minimal local footprint.
Choices made accordingly:

- **Node.js** was installed by downloading the official tarball directly
  (not Homebrew) to `~/.local/node`. It is **not on the default PATH** in
  non-interactive/tool shells — `~/.zshrc` has a line adding it for
  interactive terminals, but scripts/tools invoked by Claude Code should do:
  ```bash
  export PATH="$HOME/.local/node/bin:$PATH"
  ```
  before calling `npm`/`node`/`npx`. `scripts/dev.sh` already does this and
  is what `.claude/launch.json` points the browser-preview tool at.
- **Git identity** is set locally in this repo only (`git config
  user.name/email`, not `--global`): `offquestxo` /
  `souvinettej@icloud.com`.
- **GitHub auth is SSH**, not `gh` CLI (never installed, to save disk).
  Key: `~/.ssh/id_ed25519_thanhviet`, already added to the user's GitHub
  account and to `~/.ssh/config` for `github.com`. `git push`/`pull` over
  SSH should just work.
- No `gh` CLI means: no scripted PR/issue creation. If that's ever needed,
  ask the user before installing anything (~30-40MB standalone binary,
  no Homebrew required).

## Supabase

- Project ref: `pcywqsswbgodycqsanwm` (URL:
  `https://pcywqsswbgodycqsanwm.supabase.co`)
- Keys live in `.env.local` (gitignored, already populated — do not ask the
  user to re-paste them unless rotating). `.env.example` is the committed
  template.
- **`SUPABASE_SECRET_KEY`** is the new-style `sb_secret_...` key (Supabase's
  replacement for the legacy `service_role` JWT). It's wired into
  `src/lib/supabase/server-admin.ts` and works identically to a
  `service_role` key for the JS client — full RLS bypass, server-only.
- Schema + RLS: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
  Applied by hand via the Supabase SQL Editor (no DB password was available
  for a direct/CLI connection, and installing the Supabase CLI wasn't
  justified for a one-time run). **Any future schema change should be added
  as a new numbered file** in `supabase/migrations/` and again applied by
  hand until/unless the Supabase CLI gets adopted.
- `src/lib/supabase/types.ts` is **hand-written**, not generated — matches
  the migration as of this writing. It follows the exact shape
  `@supabase/postgrest-js` needs for inference (`Row`/`Insert`/`Update`/
  `Relationships` per table, `Functions` on the schema) — the postgrest-js
  version in use is strict about this; a naive hand-rolled type without
  `Relationships`/`Functions` fields fails with confusing `never` errors on
  every query. Update this file by hand alongside any migration, or replace
  it wholesale with `supabase gen types typescript` output once the CLI is
  installed.

## Next.js version note

This project is on **Next.js 16.3**, which just renamed the `middleware.ts`
convention to `proxy.ts` (same behavior, file renamed, exported function
renamed from `middleware` to `proxy`). This repo already uses the new
convention (`src/proxy.ts`). Don't recreate `src/middleware.ts` — it'll
conflict/warn as deprecated. See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
if this changes again — per `AGENTS.md`, check the vendored docs before
assuming familiar Next.js behavior, since this scaffold tracks a fast-moving
version.

## What's implemented

- `/` — landing page, links to login/signup
- `/login`, `/signup` — real Supabase Auth (`signInWithPassword`, `signUp`
  with `emailRedirectTo`)
- `/auth/callback` — exchanges the email-confirmation code for a session
- `/dashboard` — minimal protected page; reads the caller's own `profiles`
  row through the **anon-key** client to prove RLS is correctly scoped
  (not the admin client)
- `src/proxy.ts` — refreshes the session cookie every request, redirects
  unauthenticated users to `/login` for any route other than `/`,
  `/login`, `/signup`, `/auth/*`
- `src/app/providers.tsx` — TanStack Query provider in the root layout
- Zustand is installed but **not yet used anywhere** — no local/UI state
  exists yet to need it (will matter once the Tone Tuner or lesson drills
  are built)
- DB: `profiles` (auto-created via `handle_new_user` trigger on
  `auth.users` insert), `units`, `words`, `user_progress`,
  `talk_practice_sets`, `talk_practice_words`, `tone_practice_attempts`,
  `badges`, `user_badges`, `user_streaks`, `leaderboard` (view). Full RLS on
  every table — see the migration file for the policy-by-policy rationale.

## Open decisions / not started

Straight from spec Section 11, still open:

1. Offline requirement for the Tone Tuner
2. Internal distribution method (copyrighted JW.org-sourced content — needs
   a decision before any public-facing deploy, doesn't block internal
   Vercel preview usage)
3. Exact structure of "units" (by convention program / publication / topic)

Not built yet, roughly in spec order: lesson path & unit/word content
pipeline (Section 7 — founder needs a way to add content without a
developer), Tone Tuner (Section 8, the highest-risk piece — recommend
tackling its architecture next per the spec's own closing note), Talk
Practice, gamification (points/streaks/badges — DB tables exist, no app
logic writes to them yet), leaderboard UI, admin console.

## Running locally

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm run dev
```

Or via Claude Code's browser-preview tool: `preview_start` with name
`thanhviet-dev` (already configured in `.claude/launch.json`).

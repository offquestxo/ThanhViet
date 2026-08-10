# Handoff — Thanh Việt

Status snapshot for picking this project back up in a new session. Read
[`ThanhViet.md`](ThanhViet.md) (the full product spec, now committed in this
directory) first — everything below assumes that context.

## Where we left off — active bug, mid-diagnosis

**This is the most important thing to read before doing anything else.**

The user tested signup on the live Vercel deployment. The confirmation email
arrived and was clicked, but no redirect happened — didn't land on
`/auth/callback`, `/pending`, or `/dashboard`. Diagnosis so far:

- **Checked `emailRedirectTo` in `src/app/signup/page.tsx`**: it's built
  dynamically from `window.location.origin`, not hardcoded and not from an
  env var. Grepped the whole `src/` tree for `localhost`/`SITE_URL`/
  `window.location` — this is the only occurrence. So the link *should* have
  pointed at the correct live domain. This rules out the user's original
  hypothesis (a stale localhost value).
- **Leading theory**: Supabase's Auth → URL Configuration → **Redirect
  URLs** is a server-side allow-list independent of what the app sends.
  GoTrue validates `redirect_to` against it before honoring it. Every new
  Supabase project defaults its Site URL (and typically the matching
  Redirect URLs entry) to `http://localhost:3000` — so local dev may have
  worked by accident via that default, while the live Vercel domain was
  never added. This was flagged as a to-do when Vercel was first set up but
  never actually confirmed done.
- **Important caveat, don't assume more than this proves**: a real
  confirmation-email link click has **never** been successfully verified to
  complete `/auth/callback`, on *any* domain, including localhost. Every
  prior end-to-end test (see below) either got rate-limited on a disposable
  inbox before the click, or deliberately bypassed the email step via
  `supabase.auth.admin.createUser({ email_confirm: true })`. So don't treat
  the Redirect URLs theory as confirmed — it's the leading hypothesis, not a
  verified root cause.
- **Blocked on**: the live `*.vercel.app` URL. The user has it; this session
  never received it. Ask for it, then hand back the exact literal strings to
  paste into Supabase's Redirect URLs field (both the production domain and
  `localhost:3000`, both with `/auth/callback` and a `/**` wildcard), and
  suggest updating the Site URL field too (separate single field, still
  defaults to localhost).
- **After that**: the user will retest signup with a fresh email and report
  the *actual* result (works / wrong destination / error page) rather than
  assuming it's fixed. Only update this doc's "done" claims once that's
  back, not before.

## Machine quirks (read before running anything)

- **Path correction, important**: for this entire session up to this point,
  Claude was operating in `/Users/jason/ThanhViet` (no `Desktop`) — a path
  that doesn't match the harness's actual primary working directory
  (`/Users/jason/Desktop/ThanhViet`), and the mismatch went unnoticed from
  the very first command of the session. At some point the directory
  ended up consolidated into the correct location
  (`/Users/jason/Desktop/ThanhViet` — likely a manual move by the user;
  not something done from inside a Claude session). **The project now
  correctly lives at `/Users/jason/Desktop/ThanhViet`.** If you see any
  stray reference to `/Users/jason/ThanhViet` (without `Desktop`) anywhere —
  old conversation context, a stale note, whatever — it's wrong; don't
  recreate anything there. `.claude/launch.json` had this bug (pointed
  `runtimeExecutable` at the old path) and has been fixed.
- This laptop had **no Node, no Homebrew, no git identity, no SSH keys, no
  gh CLI** when this project started, and the user wants minimal local
  footprint. Choices made accordingly:
  - **Node.js** installed via the official tarball (not Homebrew) to
    `~/.local/node`. **Not on the default PATH** in non-interactive/tool
    shells — `~/.zshrc` adds it for interactive terminals, but
    scripts/tools invoked by Claude Code should do
    `export PATH="$HOME/.local/node/bin:$PATH"` before calling
    `npm`/`node`/`npx`. `scripts/dev.sh` already does this and is what
    `.claude/launch.json` points the browser-preview tool at.
  - **Git identity** set locally in this repo only (not `--global`):
    `offquestxo` / `souvinettej@icloud.com`.
  - **GitHub auth is SSH**, not `gh` CLI (never installed). Key:
    `~/.ssh/id_ed25519_thanhviet`, already on the user's GitHub account and
    in `~/.ssh/config`. `git push`/`pull` should just work.
  - No `gh` CLI means no scripted PR/issue creation. Ask before installing
    anything.

## Supabase

- Project ref: `pcywqsswbgodycqsanwm` (URL:
  `https://pcywqsswbgodycqsanwm.supabase.co`)
- Keys live in `.env.local` (gitignored, already populated — don't ask the
  user to re-paste them unless rotating) and are also set in Vercel's
  project environment variables (confirmed working — signup's
  `supabase.auth.signUp()` call succeeds live and sends real email, which
  proves the Vercel-side env vars are correct).
- **`SUPABASE_SECRET_KEY`** is the new-style `sb_secret_...` key (replaces
  the legacy `service_role` JWT, same capability). Wired into
  `src/lib/supabase/server-admin.ts` — full RLS bypass, server-only.
- **Auth → URL Configuration is the current open item** — see the top of
  this doc. Not yet confirmed correct for the live domain.
- Schema + RLS: two migrations, both applied by hand via the Supabase SQL
  Editor (no DB password available for a direct/CLI connection):
  - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) —
    base schema from spec Section 9 (profiles, units, words, user_progress,
    talk_practice_sets/words, tone_practice_attempts, badges, user_streaks,
    leaderboard view).
  - [`supabase/migrations/0002_roles_and_approval.sql`](supabase/migrations/0002_roles_and_approval.sql) —
    adds `profiles.role` (member/admin/ceo) and `approval_status`
    (pending/approved/rejected), plus `email` (mirrored from `auth.users`
    for the admin UI). RLS on `units`/`words` now requires
    `approval_status = 'approved'`, not just being signed in. **Also adds a
    `BEFORE UPDATE` trigger** (`enforce_profile_field_permissions`) — RLS
    alone can't do column-level checks, so this is what actually stops a
    member from self-granting `role`/`ceo` by editing their own profile row
    directly. The trigger explicitly no-ops for `service_role` (the admin
    client) since that path is authorized instead by
    `src/app/admin/actions.ts` re-checking the caller's role server-side
    before every write.
  - **Any future schema change**: add a new numbered migration file, apply
    by hand until/unless the Supabase CLI gets adopted.
  - **Your own account** (`souvinettej@icloud.com`) is already bootstrapped
    to `role='ceo'`, `approval_status='approved'` directly in the DB.
- `src/lib/supabase/types.ts` is **hand-written**, not generated — matches
  both migrations as of this writing. Follows the exact shape
  `@supabase/postgrest-js` needs (`Row`/`Insert`/`Update`/`Relationships`
  per table, `Functions` on the schema, FK relationships declared per
  column) — without this exact shape, queries silently infer as `never`.
  Update by hand alongside any migration, or replace wholesale with
  `supabase gen types typescript` output once the CLI is installed.

## Next.js version note

**Next.js 16.3** renamed `middleware.ts` to `proxy.ts` (same behavior, file
+ exported function renamed). This repo already uses the new convention
(`src/proxy.ts`) — don't recreate `src/middleware.ts`. Per `AGENTS.md`,
check `node_modules/next/dist/docs/` before assuming familiar Next.js
behavior — this scaffold tracks a fast-moving version.

## What's implemented

- `/` — landing page, links to login/signup
- `/login`, `/signup` — real Supabase Auth. Signup's redirect behavior is
  the open bug above.
- `/auth/callback` — exchanges the email-confirmation code for a session
  (never yet confirmed to actually complete via a real email click — see
  top of doc)
- `/pending` — shown to signed-in users whose `approval_status` isn't
  `approved`; explains status, offers sign-out
- `/admin` — restricted to `role in ('admin', 'ceo')`, re-checked
  server-side (not just hidden UI). Pending-approval queue with
  approve/reject; a role-management section (promote/demote) visible only
  to `ceo`. Writes go through `src/app/admin/actions.ts` Server Actions,
  which re-derive the caller's role from the DB before touching the admin
  client — never trust a client-supplied role or an already-hidden button.
- `/dashboard` — protected page. Shows profile info (name/points/accent),
  an `Admin` link for staff, and a lesson list querying `units` + nested
  `words` via the FK relationship declared in `types.ts`.
- `src/proxy.ts` (+ `src/lib/supabase/middleware.ts`) — refreshes the
  session cookie every request; redirects unauthenticated users to
  `/login`; redirects signed-in-but-unapproved users to `/pending` from
  anywhere except `/pending`, `/admin`, and the auth routes (those
  exemptions avoid redirect loops / admin lockout).
- `src/app/providers.tsx` — TanStack Query provider in the root layout.
  Zustand is installed but **not yet used anywhere**.
- `scripts/seed-unit.mjs` (`npm run seed -- <file>`) — minimal content
  loader per spec Section 7's own suggestion that this can start as simple
  as a script/spreadsheet import. Reads a JSON file
  (`content/units/unit-1.example.json` is the template/example), upserts a
  unit + its words via the admin client, idempotent on re-run (skips
  existing unit/words by title / vietnamese_text match rather than
  duplicating). Already run for real against the live DB.
- DB: see the Supabase section above for the full table list. Full RLS on
  every table.

## Testing approach worth knowing about

For anything requiring a signed-in user, the pattern used throughout this
project is: create disposable test accounts via
`supabase.auth.admin.createUser({ email_confirm: true, ... })` (bypasses
the email-click step entirely — useful, but see the caveat at the top of
this doc about what that does and doesn't prove), drive the real app UI via
the browser tool (not just API calls) for anything UI/RLS/Server-Action
related, then delete the test accounts via `admin.deleteUser()` afterward
so they don't clutter the real user table. Never touch the user's own
account credentials — a second synthetic `ceo`-role test account was used
to test `/admin`'s role-management section rather than asking for the real
password.

## Open decisions / not started

Straight from spec Section 11, still open:

1. Offline requirement for the Tone Tuner
2. Internal distribution method (copyrighted JW.org-sourced content) — now
   more concretely relevant: the approval workflow (`/pending`, admin
   approve/reject) is built and gates lesson *content*, but `/signup`
   itself is still open to anyone with the live link. Worth deciding before
   real copyrighted vocabulary goes in and the link circulates.
3. Exact structure of "units" (by convention program / publication /
   topic) — the schema (`title`, `order`, `source_reference`) accommodates
   any of these; no decision forced by the current implementation.

Not built yet, roughly in spec order: founder-facing content pipeline
beyond the seed script (Section 7 — a real UI, not just a script, is
explicitly Phase 1-but-later), Tone Tuner (Section 8, the highest-risk
piece — the spec's own closing note recommends tackling its architecture
next), Talk Practice, gamification logic (points/streaks/badges — DB tables
exist, nothing writes to them yet), leaderboard UI (the `leaderboard` view
exists, unused).

## Running locally

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm run dev
```

Or via Claude Code's browser-preview tool: `preview_start` with name
`thanhviet-dev` (configured in `.claude/launch.json`).

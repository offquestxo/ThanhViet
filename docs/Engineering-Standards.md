# Thanh Việt — Engineering Standards

*Split from the master spec on August 11, 2026. See also: PRD (Product Requirements), TAD (Technical Architecture), UI/UX Design System.*

*Unlike the other three docs, this one is built from **actual established practice** during this project's build sessions, not upfront research — it documents the conventions that have proven necessary, not aspirational ones. Update it as new conventions get established; don't pad it with process that isn't actually happening yet.*

## 1. Folder Structure (as-built)

```
src/app/                    — Next.js App Router pages
src/lib/supabase/           — client.ts (browser), server.ts (cookie-based sessions), 
                               server-admin.ts (service-role, server-only), types.ts (hand-written)
src/hooks/                  — e.g. use-audio-recorder.ts
src/proxy.ts                — session refresh + auth redirect (Next.js 16.3 renamed 
                               middleware.ts → proxy.ts; don't recreate the old file)
supabase/migrations/        — numbered SQL files (0001, 0002, ...), applied by hand
scripts/                    — seed-unit.mjs and similar content-loading scripts
content/units/               — JSON content files consumed by the seed script
docs/                       — this doc + PRD/TAD/UI-UX + the four research reference docs
```

Not yet established: a dedicated `services/tone-api/` (Python/FastAPI) — will be added when Phase 1b starts.

---

## 2. Database & Migrations

**Migrations are applied by hand, not via CLI.** No direct DB password/CLI connection has been set up (the Supabase CLI wasn't judged worth installing for occasional one-off migration runs). Process: write the numbered SQL file → founder pastes it into the Supabase SQL Editor → run → **verify directly via schema introspection**, never assume success from "no error shown." This has bitten the project once already (a migration was believed applied but wasn't — the login flow "working" only proved Supabase Auth's built-in `auth.users` table existed, not that the app's own schema did).

**`types.ts` is hand-written, not generated**, and must track every migration exactly. The `postgrest-js` version in use is strict about shape (needs `Row`/`Insert`/`Update`/`Relationships`/`Functions` per table) — a naive hand-rolled type without all of those fields produces confusing `never` errors on every query. Update this file by hand alongside any migration, or switch to `supabase gen types typescript` output once the CLI is adopted.

**RLS is defense-in-depth, not the only gate.** Row-Level Security controls which *rows* a user can touch, not which *columns* of their own row they're allowed to change. Where that distinction matters (e.g., a user should never be able to set their own `role` or `approval_status`, even though it's technically their own row), a `BEFORE UPDATE` trigger enforces it — this is required, not optional, anywhere a privileged field lives on an otherwise user-writable row.

**Schema changes should be additive where possible**, but real breaking changes (e.g., dropping `words.unit_id` when the data model moved to `Chunk`) should actually be made, not left as unused dead columns — document the break clearly in the migration's own comments and in the PR/commit description.

**Dead schema from superseded designs should be dropped, not left alongside its replacement** — e.g., early `talk_practice_sets`/`talk_practice_words` stubs were removed once `WorkspaceItem`/`RehearsalChunk` replaced them, rather than leaving two competing schemas for the same feature. Flag this kind of removal explicitly when it goes beyond the literal task ask.

---

## 3. Verification Discipline

This is the single most important convention this project runs on: **"looks done" is not "confirmed done."** Specific patterns that have proven necessary:

- **Query the database directly**, via the admin client (bypasses RLS) to confirm raw data exists, and separately via the real anon-key client (RLS enforced) to confirm the actual permission model works — not just reading the code and assuming it's correct.
- **Test through a real, running browser** for anything UI-facing — a clean `tsc`/lint pass catches structural issues, not runtime/RLS/data issues.
- **Use disposable test accounts for verification, never real credentials** — create, exercise, clean up afterward. Never touch the founder's actual login.
- **Verify git pushes independently**, not by trusting the command's exit code alone: `git fetch` + local/remote SHA comparison, and where possible, an independent check against GitHub's own API (or Vercel's API for deploys) — three independent confirmations beats one assumption.
- **Show risky operations before doing them, not after.** A git history reconciliation (merge/rebase) that touches files outside the current task should be shown as a diff *before* being applied, not narrated afterward as "I already did this and here's why it was safe." (This was gotten wrong once this session, then corrected properly — the lesson stands regardless.)
- **Don't propose a plan on missing information.** If a referenced file/doc wasn't actually received, say so and ask for it again rather than sequencing work from a paraphrased summary of what it probably contains.

---

## 4. Git Workflow

- **Auth:** SSH (not `gh` CLI, to keep local footprint small) — key added to the relevant GitHub account and to `~/.ssh/config`.
- **Identity:** set locally per-repo (`git config user.name/email`), not globally.
- **Branch:** `main`, linear history preferred — rebase rather than merge-commit when reconciling diverged histories, after confirming (via diff) that doing so won't silently drop content from either side.
- **Before pushing:** typecheck and lint clean, locally verified against the real (not assumed) current state of dependent files.
- **Repo/deploy connection integrity:** confirm the deployment platform (Vercel) is actually connected to the repo being pushed to — a real incident this project hit was Vercel silently watching a differently-named repo for two days while all real work landed somewhere else. Case-sensitive repo name mismatches are a real, recurring risk category, not a one-off fluke.

---

## 5. Environment & Secrets

- `.env.local` holds real secrets, is gitignored, never committed.
- `.env.example` is the committed template — **names must match `.env.local` exactly**; this is the source of truth when setting environment variables anywhere else (e.g., Vercel's dashboard).
- `SUPABASE_SECRET_KEY` (the modern `sb_secret_...` key, replacing the legacy `service_role` JWT) is server-only — used in `server-admin.ts`. Periodically grep the client bundle to confirm it never leaks into anything shipped to the browser; don't just trust that the admin client "is server-only" as a design intent without checking.
- Node installed via direct tarball download (not Homebrew) when disk space is constrained — not on the default PATH in non-interactive/tool shells, so scripts invoking `npm`/`node`/`npx` need to export the path explicitly first.

---

## 6. Deployment

- **Vercel**, connected via GitHub integration — auto-deploys on push to `main`, *provided* the repo connection is actually correct (see Section 4).
- **Redirect URLs:** every domain the app is served from (production, and `localhost` for local dev) must be explicitly added to Supabase's Authentication → URL Configuration → Redirect URLs allow-list, plus the Site URL field. Missing this causes email-confirmation links to silently fail on whichever domain wasn't added — the app itself loads fine, only the auth redirect breaks.
- **Checking deployment status without dashboard access:** a Vercel API token (scoped, revocable at `vercel.com/account/tokens`) is the correct tool for programmatic access — never a shared account login. Reading deployment status via the API isn't billed; only actual hosted-app usage (bandwidth, edge requests, function invocations, build minutes) counts against Hobby-tier limits.

---

## 7. AI-Assisted Development Guidelines

- **Read all provided context in full before proposing a plan** — the spec docs, the research docs behind them, and the existing codebase's actual conventions (don't guess at patterns; check how the existing Server Action / client / component style already works before adding to it).
- **Flag scope decisions rather than silently picking one** — e.g., when a design doc conflicts with an already-resolved spec decision, say so explicitly and ask, don't quietly implement whichever version was more recently mentioned.
- **Extending beyond the literal task is fine, but must be flagged, not silent** — e.g., dropping genuinely dead schema while doing a related migration.
- **Typecheck and lint clean is a minimum gate, not a completion signal** — pair with Section 3's verification discipline before reporting anything as done.
- **Stage large or structurally significant work into checkpoints** — get a sequencing plan approved before writing code for genuinely large pieces of work (e.g., a full homepage redesign), and check in after each stage rather than running the whole thing as one uninterruptible pass.

---

## 8. Not Yet Established

Being explicit about what this document does *not* yet cover, since it should only describe real practice:

- No CI pipeline is currently configured (typecheck/lint currently run manually, not on push)
- No automated test suite exists yet (unit tests, integration tests) — verification has been manual/live to this point
- No formal code review process (single-developer + AI-assisted build to date)
- No linting/formatting config beyond whatever Next.js's default ESLint setup provides — hasn't needed customization yet

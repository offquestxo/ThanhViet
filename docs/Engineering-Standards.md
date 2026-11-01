# Thanh Việt — Engineering Standards

*See also: PRD, TAD, UI/UX Design System.*

These are the conventions the project actually follows today. If something here stops being true, change the doc.

## 1. Folder structure

```
src/app/                Next.js App Router pages and API routes
src/components/         UI components
src/lib/supabase/       client.ts (browser), server.ts (cookie session),
                        server-admin.ts (service role, server only), types.ts
src/hooks/              e.g. use-audio-recorder.ts
src/proxy.ts            session refresh + auth redirects (Next 16 renamed
                        middleware.ts to proxy.ts)
supabase/migrations/    numbered SQL files, applied by hand
scripts/                content seeding and asset scripts
content/                JSON lesson and vocab content
tone-analysis/          Python tone engine (deployed to Modal) + test harness
docs/                   product, architecture and design docs
```

## 2. Database and migrations

- **Migrations are applied by hand** in the Supabase SQL Editor. Each change is a new numbered file in `supabase/migrations/`. After running one, check the schema directly to confirm it applied. "No error" isn't proof.
- **`types.ts` is hand-written** and has to match the migrations. `postgrest-js` needs the full `Row` / `Insert` / `Update` / `Relationships` shape per table, or queries quietly type as `never`. Update it with every migration (or switch to `supabase gen types` later).
- **RLS limits rows, not columns.** Where a user can edit their own row but not certain fields on it (`role`, `approval_status`), a `BEFORE UPDATE` trigger enforces that.
- **Prefer additive changes**, but when the model really changes, make the breaking change and drop the dead columns or tables. Explain it in the migration's header comment.

## 3. Testing and verification

There's no automated test suite for the web app yet, so verification is manual:

- Check data both through the admin client (bypasses RLS) and through a normal signed-in client (RLS on), so you know the permissions work, not just the data.
- Test UI changes in a real browser, on a phone-sized viewport. Typecheck and lint passing doesn't cover runtime or RLS problems.
- Use throwaway test accounts, never a real member's login.

The tone engine has its own pytest suite in `tone-analysis/tests`.

## 4. Git

- Work on `main` with a linear history. Rebase rather than merge when histories diverge.
- Run `npx tsc --noEmit` and `npm run lint` before pushing.
- Vercel deploys from `main`. If a push doesn't show up, check that Vercel is connected to this exact repo name (it's case-sensitive).

## 5. Environment and secrets

- Real values live in `.env.local`, which is gitignored. `.env.example` is the template and its variable names must match.
- `SUPABASE_SECRET_KEY` and `TONE_ENGINE_SHARED_SECRET` are server-only. Never prefix them with `NEXT_PUBLIC_` or import them into a client component.
- Tone engine secrets (`NVIDIA_API_KEY`, the shared secret) live in Modal, not in git.

## 6. Deployment

- **Web app:** Vercel, auto-deploys on push to `main`.
- **Auth redirects:** every domain the app runs on (production and `localhost:3000`) has to be in Supabase → Authentication → URL Configuration → Redirect URLs, and the Site URL should be the production domain. Without this, email confirmation links fail on that domain.
- **Tone engine:** `modal deploy modal_app.py` from `tone-analysis/`.

## 7. Not set up yet

- CI (typecheck and lint run manually)
- Automated tests for the web app
- Formatting config beyond the Next.js ESLint defaults

# Thanh Việt

A Vietnamese learning app I'm building for our study group: around 20 to 50 people, mostly beginners, all learning the Northern (Hanoi) accent.

Most language apps teach Vietnamese as a list of words with English next to them. Tones are what trip beginners up, though, so this app is built around hearing and saying them. Its main feature is the **Tone Tuner**: you say a word and a dial, like a guitar tuner, shows whether you hit the tone.

It's a work in progress. Signing up needs approval from an admin, since the app is meant for one group.

## What's in it

- **Collections.** Picture-based vocab sets (Food, Colors, The Body, Clothing, Home). Each has four short activities: See it, Hear it, Match and Say it.
- **Tone Tuner (beta).** Pick one of the six tones (a à á ả ã ạ), say a practice word, and watch the needle. It moves live while you speak, then settles once the server has analyzed the recording. "In tune" means two separate Vietnamese speech models both heard the right word with the right tone.
- **Home.** Your streak, a "continue where you left off" card, today's goal, and a tone of the day.
- **Admin.** Approve new members and manage roles.
- Installs on a phone as a PWA, with light and dark mode and a sparrow mascot.

Coming later: **Practice**, where you paste in a talk or reading you need to give and the app breaks it into chunks to rehearse.

## How it's built

| Part | Tech |
|---|---|
| Web app | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Data and auth | Supabase (Postgres, Auth, row-level security) |
| State | TanStack Query, Zustand |
| Tone engine | Python on [Modal](https://modal.com): Praat/Parselmouth for pitch, plus PhoWhisper and NVIDIA Parakeet speech recognition |
| Hosting | Vercel |

The browser never talks to the tone engine directly. Recordings go to `/api/tone/analyze` on the Next.js server, which forwards them to Modal with a shared secret.

## Running it locally

You'll need Node 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Then open http://localhost:3000.

**Environment variables** (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: safe to expose. Access is controlled by row-level security.
- `SUPABASE_SECRET_KEY`: server only, bypasses RLS. Never give it a `NEXT_PUBLIC_` prefix.
- `MODAL_TONE_ENGINE_URL`, `TONE_ENGINE_SHARED_SECRET`: only needed for the Tone Tuner and Say it.

**Database:** run the files in `supabase/migrations/` in order in the Supabase SQL Editor. `npm run seed -- content/units/unit-1.example.json` loads the sample lesson.

**Tone engine:** see [`tone-analysis/README.md`](tone-analysis/README.md) for setup and deployment.

## Project layout

```
src/app/          pages and API routes
src/components/   UI (app shell, lessons, tone tuner, vocab activities)
src/lib/          data access, tone logic, Supabase clients
supabase/         SQL migrations
content/          lesson, vocab and Tone Tuner word lists (JSON)
public/           audio, vocab pictures, mascot, icons
tone-analysis/    Python tone engine and its tests
docs/             product spec, architecture, design system, curriculum
```

## Docs

- [Product requirements](docs/PRD.md)
- [Technical architecture](docs/TAD.md)
- [UI/UX design system](docs/UI-UX-Design-System.md)
- [Curriculum and lesson design](docs/Curriculum-Lesson-Design-Framework.md)
- [Engineering standards](docs/Engineering-Standards.md)

## Audio and credits

Placeholder vocab audio is generated with Google Cloud Text-to-Speech until native recordings are done. Openly licensed recordings used only to test the tone engine are credited in [`tone-analysis/test-audio/SOURCES.md`](tone-analysis/test-audio/SOURCES.md). They aren't included in the repo.

# Thanh Việt — Design Handoff — Homepage (Version 1)

## Vision
Design a premium Vietnamese learning platform that feels like a blend of Apple, Apple Fitness+, Apple Music, Duolingo, Headspace, and Spotify. The experience should feel modern, premium, calm, interactive, and welcoming. The user should feel like they're opening a beautiful learning workspace — not logging into software. **This is not a dashboard. It is a personal learning environment.**

## Brand
**Thanh Việt** — a premium Vietnamese learning platform focused on helping learners confidently speak, read, and understand Vietnamese through structured collections and interactive pronunciation coaching. The Tone Tuner is the signature feature — not the brand itself.

## Overall Experience
The homepage should answer one question: **what should I do next?** The interface should never overwhelm the learner. Everything should guide them toward their next lesson.

## Design Style
Inspired by Apple. Large typography, soft rounded corners (20–24px), plenty of white space, soft shadows, layered cards, warm lighting, friendly illustrations, minimal borders, premium feel, calm colors, motion throughout. Alive without being distracting.

## Color Palette
- **Background:** Warm White, Cream, Soft Gray
- **Primary:** Emerald, Teal
- **Accent:** Warm Gold, Soft Coral, small touches of Orange
- **Typography:** Dark Slate, Deep Navy — never harsh black

## Homepage Layout

**Top Navigation:** Logo, Search, Streak, XP, Notifications, User Avatar

**Hero Card** — large immersive focal card:
- Greeting (e.g., "Xin chào, Jay 👋 / Ready for today's journey?")
- Current Journey (e.g., "Psalm 23 / Scripture Collection")
- Large progress bar
- "Continue Journey" button + "View Journey" secondary button
- Background should feel alive — warm sunlight, floating particles, moving leaves, subtle ambient animation. Never static.

**Avatar** — a friendly learning companion. Not childish, not cartoonish — think Pixar/Apple/Headspace. Appears occasionally with encouraging messages ("Only two words left," "Great pronunciation," "Ready to practice?"). Never intrusive, never covering content.

**Progress Cards** (below hero, four clean cards): 🔥 Current Streak · ⭐ XP · 🎯 Tone Accuracy · 📖 Reading Readiness

**Collections** — replace traditional courses, displayed as large visual cards, each with its own visual identity:
- 📖 Scriptures — warm parchment, open Bible, gold accents
- 🎤 Presentations — stage, podium, audience lighting
- 🎙 Talks — professional microphone, elegant dark studio
- ⭐ Favorites — notebook, bookmarks, gold star

Should feel like Spotify playlists.

**Today's Goal** — simple checklist (e.g., "Learn 12 Words," "Practice Tone Tuner," "Read Today's Scripture," "Complete Journey"). One tap begins each activity.

**Continue Practice** — shows current assignment (e.g., "Psalm 23 — 74% Ready"), Resume button, large progress bar.

**Friends Leaderboard** — Duolingo Leagues-inspired weekly leaderboard (🥇🥈🥉 + ranked list), a nudge line ("Only 40 XP to pass Hannah"), large "Practice Now" button. Goal is friendly motivation, not competition.

**Weak Words** — rows of word needing practice: Vietnamese, English, mini tone contour, Practice button.

**Sidebar Navigation** (desktop, always visible): Home, Learn, Practice, Tone Tuner, Leaderboard, Profile

## Motion
Apple-like throughout: hero background slowly moves, sunlight shifts, cards gently elevate on hover, buttons animate, progress bars smoothly fill, collections scale slightly, avatar waves occasionally, confetti after completing a Journey, smooth page transitions. Nothing abrupt.

## UX Philosophy
The app should never ask "Where do you want to go?" — instead: **"Here's what you should do next."** The homepage should always recommend the next lesson automatically. The learner should almost never have to think.

## Premium Feel
Avoid: a dashboard, enterprise software, admin software.
Aim for: a premium Apple product, a modern streaming platform, a personal learning studio.

## Future Vision
Eventually the homepage should resemble a personal study desk — warm lighting, open Bible, notebook, microphone, today's assignment, Continue Journey. Immersive while remaining clean and distraction-free.

## Technical Stack (as specified in the handoff)
**Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Lucide Icons
**Backend:** Supabase, PostgreSQL, Supabase Auth, Supabase Storage, Row Level Security, Edge Functions
**Deployment:** Vercel
**AI Development:** Claude Code
**Design System:** Responsive desktop-first, mobile adaptation after desktop approval, component-driven architecture, reusable cards/buttons/collection components

## Success Criteria
When someone opens Thanh Việt for the first time, they should immediately think: "This is beautiful." "I know exactly what to do next." "I want to continue learning." The homepage should feel less like an app and more like a welcoming place learners return to every day.

---
*Note: this doc has already been partially reconciled against the rest of the spec — see Section 5.0 of vietnamese-app-spec.md for the two decisions resolved (Favorites progress bar dropped; Weak Words "Practice" routes to SRS flashcard review, not Tone Tuner) and the build-sequencing note about Tone Tuner-dependent homepage elements.*

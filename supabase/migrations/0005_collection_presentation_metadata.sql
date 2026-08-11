-- Thanh Việt — Collection presentation metadata (icon_key, theme_key)
--
-- Narrow, founder-scoped addition: controlled semantic values for how a
-- Collection presents itself on the homepage (icon + color theme), not
-- arbitrary CSS/component values stored in the DB. The frontend owns the
-- actual mapping from these keys to Lucide icons / design tokens
-- (src/components/home/collections-grid.tsx) — this migration only adds
-- the columns and a check-constrained value set, following this schema's
-- established text+check convention (structural_concept, item_type, tier,
-- mastery_status, etc. in prior migrations) rather than a native Postgres
-- enum type.
--
-- Explicitly NOT in scope here (per founder direction): no Favorites
-- schema, no Scriptures/Presentations/Talks rows created, no resolution
-- of PRD open decision #2 (how Collections are actually organized — by
-- convention, publication, topic, or a mix). Presentation metadata only;
-- that structural question stays open.
--
-- Run this once in the Supabase SQL Editor, AFTER 0001–0004.

alter table public.collections
  add column icon_key text not null default 'library'
    check (icon_key in ('book', 'presentation', 'microphone', 'library')),
  add column theme_key text not null default 'muted'
    check (theme_key in ('primary', 'secondary', 'accent', 'muted'));

comment on column public.collections.icon_key is
  'Controlled icon category for homepage presentation — mapped to an
   actual Lucide icon component in the frontend
   (src/components/home/collections-grid.tsx). Never a component name or
   arbitrary string; the check constraint is the source of truth for
   what''s valid, the frontend map must stay in sync with it by hand.';

comment on column public.collections.theme_key is
  'Controlled color theme for homepage presentation — mapped to this
   app''s existing design tokens (--primary/--secondary/--accent/--muted,
   src/app/globals.css). Never a raw hex/CSS value.';

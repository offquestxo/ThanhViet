import { AppShell } from "@/components/app-shell/app-shell";

// Route group — doesn't affect URLs (/dashboard stays /dashboard). Applies
// the persistent nav shell to the "browsing" screens.
//
// FLAG (Stage 2 scoping decision): only /dashboard lives under this group
// right now. /admin, /pending, and /lesson/[unitId] are deliberately left
// out — /admin is staff tooling that probably wants its own chrome rather
// than the member-facing nav, /pending shouldn't show nav links to content
// a not-yet-approved user can't reach, and /lesson is an intentionally
// immersive, chrome-free flow (same reasoning most language apps use during
// an active lesson). None of that is a technical constraint — just not
// decided, so left alone rather than assumed.
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}

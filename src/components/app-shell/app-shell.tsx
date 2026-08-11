import Link from "next/link";
import { Leaf } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { TopBar } from "./top-bar";
import { WeeklyProgress } from "./weekly-progress";

// The persistent page frame — sidebar nav + top bar, wrapping every
// authenticated screen it's applied to (UI-UX-Design-System.md Section 1/5,
// "Sidebar Navigation (desktop, always visible)"). Desktop-first per
// Section 9 of that doc — no mobile-specific collapse/drawer behavior yet,
// intentionally deferred rather than guessed at.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-border p-4">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
          {/* Placeholder mark — the real logo asset (Thanh Viet Logo.png)
              isn't integrated yet (UI-UX-Design-System.md Section 8 flag).
              This is a Lucide stand-in, not the brand mark. */}
          <Leaf className="size-5 text-primary" strokeWidth={2} />
          <span className="text-base font-semibold">Thanh Việt</span>
        </Link>
        <SidebarNav />
        <WeeklyProgress />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

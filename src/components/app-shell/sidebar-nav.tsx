"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  PenLine,
  AudioWaveform,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Nav item destinations — UI-UX-Design-System.md Section 1's tab names
// (Home · Collections · Practice · Tone Tuner · Leaderboard · Profile).
//
// FLAG (Stage 2 scoping decision): only /dashboard has real content behind
// it right now — Collections/Practice/Tone Tuner/Leaderboard/Profile route
// to minimal placeholder pages created this stage (structural only, no
// data — that's Stage 3). "Home" points at the existing /dashboard rather
// than a new /home route, since /dashboard is today's real, working
// equivalent — introducing a separate empty /home would just orphan it.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/collections", label: "Collections", icon: Library },
  { href: "/practice", label: "Practice", icon: PenLine },
  { href: "/tone-tuner", label: "Tone Tuner", icon: AudioWaveform },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={isActive}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
            )}
          >
            <Icon className="size-4.5 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

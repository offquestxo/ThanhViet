"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, LayoutGrid, Mic, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActivePath } from "./sidebar-nav";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/tone-tuner", label: "Tone Tuner", icon: Mic, center: true },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/**
 * Screens that take the whole phone screen (their own back/close button,
 * no tab bar): the Tone Tuner and the picture-collection activities.
 */
export function isFocusRoute(pathname: string | null) {
  return pathname === "/tone-tuner" || /^\/collections\/[^/]+\/(see|hear|match|say)$/.test(pathname ?? "");
}

/** Bottom tab bar for phones (the sidebar is hidden below `md`), with the
 *  Tone Tuner as a raised round button in the middle. Pads for the iPhone
 *  home indicator when launched from the home screen. */
export function MobileNav() {
  const pathname = usePathname();
  if (isFocusRoute(pathname)) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex items-start justify-around pt-2.5">
        {TABS.map((tab) => {
          const active = isActivePath(pathname, tab.href);
          const Icon = tab.icon;
          const center = "center" in tab && tab.center;
          return (
            <li key={tab.href} className="flex min-w-14 justify-center">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 text-[11px]",
                  center && "-mt-6",
                  active ? "font-bold text-primary" : "font-semibold text-muted-foreground"
                )}
              >
                {center ? (
                  <span className="flex size-14 items-center justify-center rounded-full bg-hero text-hero-foreground shadow-[0_6px_18px_rgba(14,127,102,0.35)]">
                    <Icon className="size-6" strokeWidth={2.2} />
                  </span>
                ) : (
                  <Icon className="size-6" strokeWidth={2} />
                )}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

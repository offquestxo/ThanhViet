"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath } from "./sidebar-nav";

/** Bottom tab bar for phones (the sidebar is hidden below `md`). Pads for
 *  the iPhone home indicator when launched from the home screen. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="flex">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import Link from "next/link";
import { BookOpen, Mic, Presentation, Star, Library, type LucideIcon } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type IconKey = Database["public"]["Tables"]["collections"]["Row"]["icon_key"];
type ThemeKey = Database["public"]["Tables"]["collections"]["Row"]["theme_key"];

export type RealCollection = {
  id: string;
  title: string;
  unitCount: number;
  iconKey: IconKey;
  themeKey: ThemeKey;
};

// Controlled mapping from DB-stored keys (migration 0005) to actual
// design-system values. This is the one place these keys get turned into
// a real Lucide component / real color classes — the DB never stores a
// component name or CSS value directly. Must stay in sync BY HAND with
// migration 0005's check constraints; there's no way to enforce that
// automatically without codegen this project doesn't have yet.
const ICON_MAP: Record<IconKey, LucideIcon> = {
  book: BookOpen,
  presentation: Presentation,
  microphone: Mic,
  library: Library,
};

const THEME_MAP: Record<ThemeKey, string> = {
  primary: "bg-primary/15 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  accent: "bg-accent/15 text-accent",
  muted: "bg-muted text-muted-foreground",
};

/**
 * Real Collection cards, sourced from the `collections` table + a real
 * per-collection unit count. No fabricated progress percentage: no
 * per-user progress-through-a-collection is computed anywhere yet, so
 * this shows a real structural count (units) instead of an invented
 * completion %.
 *
 * Favorites is appended separately, still fully placeholder — it isn't a
 * curriculum Collection at all (Section 1: a personal, non-linear
 * bookmark list), and there's no schema for it anywhere (no
 * `user_favorites` table). Explicitly out of scope for this pass, per the
 * founder's own direction — not something to quietly build here.
 */
export function CollectionsGrid({ collections }: { collections: RealCollection[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {collections.map((collection) => {
        const Icon = ICON_MAP[collection.iconKey];
        const themeClass = THEME_MAP[collection.themeKey];
        return (
          <Link key={collection.id} href="/collections">
            <AppCard className="h-full transition-shadow hover:shadow-[var(--shadow-hover)]">
              <CardContent className="flex flex-col gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    themeClass
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-medium">{collection.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {collection.unitCount} unit{collection.unitCount === 1 ? "" : "s"}
                  </p>
                </div>
              </CardContent>
            </AppCard>
          </Link>
        );
      })}

      <AppCard className="h-full">
        <CardContent className="flex flex-col gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent-coral/15 text-accent-coral">
            <Star className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-medium">Favorites</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </CardContent>
      </AppCard>
    </div>
  );
}

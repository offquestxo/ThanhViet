import { Bell, Flame, Leaf, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Placeholder-only, per Stage 2 scope — no real user/profile/streak data is
// fetched here (that's Stage 3). Streak/XP/avatar are static stand-ins so
// the layout and token usage can be judged for real, without pretending
// this is wired to anything yet.
export function TopBar() {
  return (
    <header className="flex items-center gap-4 border-b border-border px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 md:px-6 md:py-4">
      {/* Phones: app name instead of the (disabled, placeholder) search. */}
      <div className="flex items-center gap-2 md:hidden">
        <Leaf className="size-5 text-primary" strokeWidth={2} />
        <span className="text-base font-semibold">Thanh Việt</span>
      </div>
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search words, phrases, or collections…"
          className="pl-9"
          disabled
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Flame className="size-4.5 text-accent-orange" strokeWidth={1.75} />
          <span data-placeholder="streak">—</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Star className="size-4.5 text-accent" strokeWidth={1.75} />
          <span data-placeholder="xp">—</span>
        </div>

        <Button variant="ghost" size="icon" aria-label="Notifications" disabled className="hidden md:inline-flex">
          <Bell className="size-4.5" strokeWidth={1.75} />
        </Button>

        <Avatar className="size-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            ?
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

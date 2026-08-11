import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui's standard cn() helper — merges Tailwind classes, later ones
// winning on conflict. Every shadcn component imports this from
// "@/lib/utils" (see components.json's `aliases.utils`). Not created by
// Stage 1's `shadcn init` (it died before reaching this step, and creating
// it was outside that stage's stated file scope) — first thing Stage 2
// needs before any component can be added.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// shadcn's generated Card (src/components/ui/card.tsx) defaults to
// Tailwind's fixed `rounded-xl` — it does NOT pick up --radius-card
// automatically (confirmed by reading the generated file, not assumed).
// This wrapper is the explicit application point carried forward from
// Stage 1's token notes. Kept as a separate file rather than editing the
// generated card.tsx directly, so a future `shadcn add card` update
// doesn't clobber it.
export function AppCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("rounded-[var(--radius-card)] shadow-[var(--shadow-card)]", className)}
      {...props}
    />
  );
}

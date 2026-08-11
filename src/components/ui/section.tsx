import { cn } from "@/lib/utils";

// Generic section wrapper — consistent heading/spacing rhythm for the
// homepage's section-by-section layout (UI-UX-Design-System.md Section 5:
// "Hero → Progress Cards → Collections → Today's Goal → Continue Practice
// → Leaderboard → Weak Words"). Structural only — no data opinions.
export function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {(title || action) && (
        <div className="flex items-baseline justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

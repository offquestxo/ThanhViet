"use client";

/**
 * "Thứ Năm · Thursday", in the viewer's own time zone. Rendered on the
 * client so the day matches the phone, not the server; the server's guess
 * can differ near midnight, hence suppressHydrationWarning.
 */
export function TodayLabel() {
  const now = new Date();
  const vi = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(now);
  const en = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now);
  return (
    <span suppressHydrationWarning className="text-sm font-medium text-muted-foreground">
      {vi.charAt(0).toUpperCase() + vi.slice(1)} · {en}
    </span>
  );
}

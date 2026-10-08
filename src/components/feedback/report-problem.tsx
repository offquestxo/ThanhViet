"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/app/feedback/actions";
import { cn } from "@/lib/utils";

const MAX = 1000;

/** "iPhone · Safari · home screen app · 390×844" — a short description, not the user-agent. */
function describeDevice(): string {
  const ua = navigator.userAgent;
  const platform = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Macintosh/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : "Other";
  const browser = /EdgA?\//.test(ua)
    ? "Edge"
    : /SamsungBrowser/.test(ua)
      ? "Samsung Internet"
      : /CriOS|Chrome\//.test(ua)
        ? "Chrome"
        : /FxiOS|Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Other";
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return [platform, browser, standalone ? "home screen app" : "browser tab", `${window.innerWidth}×${window.innerHeight}`].join(" · ");
}

/**
 * Beta "Report a problem": a short note plus the page and device type,
 * saved for admins (/admin). `icon` sits in the app's top bar; `link` is a
 * plain text link for pages without it (lesson, pending, admin).
 */
export function ReportProblem({ variant = "icon", className }: { variant?: "icon" | "link"; className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" } | { kind: "sent" } | { kind: "error"; message: string }>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setStatus({ kind: "idle" });
  };

  const send = () =>
    startTransition(async () => {
      const page = pathname + (window.location.search || "");
      const res = await submitFeedback(note, page, describeDevice());
      if (res.ok) {
        setNote("");
        setStatus({ kind: "sent" });
      } else {
        setStatus({ kind: "error", message: res.error });
      }
    });

  return (
    <>
      {variant === "icon" ? (
        <Button variant="ghost" size="icon" aria-label="Report a problem" onClick={() => setOpen(true)} className={className}>
          <MessageSquareWarning className="size-4.5" strokeWidth={1.75} />
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline", className)}
        >
          <MessageSquareWarning className="size-3.5" /> Report a problem
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-problem-title"
            className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-left shadow-xl sm:pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 id="report-problem-title" className="text-base font-semibold">
                Report a problem
              </h2>
              <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={close}>
                <X />
              </Button>
            </div>

            {status.kind === "sent" ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm">Thanks — sent. An admin will see it.</p>
                <Button onClick={close}>Done</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  What went wrong? We save your note, this page and your device type (e.g. &ldquo;iPhone · Safari&rdquo;) — no
                  recordings or screenshots.
                </p>
                <textarea
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, MAX))}
                  rows={4}
                  className="w-full resize-none rounded-md border border-input bg-background p-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. The play button on “màu đỏ” made no sound."
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {note.length}/{MAX}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={close}>
                      Cancel
                    </Button>
                    <Button onClick={send} disabled={pending || !note.trim()}>
                      {pending ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </div>
                {status.kind === "error" && <p className="text-sm text-destructive">{status.message}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

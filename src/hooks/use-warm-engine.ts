"use client";

import { useEffect } from "react";

/** Wake the tone engine when a page that records opens, so the first
 *  recording doesn't pay the ~40 s cold start. Fire-and-forget. */
export function useWarmEngine() {
  useEffect(() => {
    fetch("/api/tone/warm", { method: "POST" }).catch(() => {});
  }, []);
}

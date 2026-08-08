import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Supabase client for use in Client Components ("use client").
 * Uses the public anon key — safe to expose to the browser. Access control
 * is enforced by Postgres Row-Level Security policies, not by this key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

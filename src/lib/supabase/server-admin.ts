import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * ADMIN CLIENT — bypasses Row-Level Security entirely.
 *
 * Only import this from server-only code that truly needs elevated access
 * (e.g. the founder-facing admin console in spec Section 5.9 for bulk
 * content import). Never import this into a Client Component, never return
 * its results directly to the browser without checking authorization
 * yourself, and never log the key.
 *
 * This file has no "use client" and relies on SUPABASE_SECRET_KEY being
 * absent from the browser bundle (it's not NEXT_PUBLIC_-prefixed, so Next.js
 * won't inline it client-side — but Next also won't stop you from importing
 * this module into client code, so be deliberate about where you use it).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

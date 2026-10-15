"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { JadeScreen, ToneRow, jadeInput, jadePrimary, jadeSecondary } from "@/components/auth/jade-screen";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <JadeScreen>
      <ToneRow size="sm" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[34px] leading-tight font-extrabold tracking-[-0.03em]">Welcome back</h1>
        <p className="text-base text-[#cfe5dd]">Log in to keep practising.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#cfe5dd]">
          Email
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={jadeInput}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#cfe5dd]">
          Password
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={jadeInput}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-[#3a2220] px-3 py-2 text-sm text-[#f2a79e]">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={`${jadePrimary} mt-2`}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="flex-1" />
      <Link href="/signup" className={jadeSecondary}>
        New here? Create an account
      </Link>
    </JadeScreen>
  );
}

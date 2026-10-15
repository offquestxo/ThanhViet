"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { JadeScreen, ToneRow, jadeInput, jadePrimary, jadeSecondary } from "@/components/auth/jade-screen";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <JadeScreen>
        <ToneRow size="sm" />
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.02em]">Check your email</h1>
          <p className="text-base text-[#cfe5dd]">
            We sent a confirmation link to <strong className="text-[#fdfbf6]">{email}</strong>. Click it to finish creating your
            account.
          </p>
        </div>
        <div className="flex-1" />
        <Link href="/login" className={jadeSecondary}>
          Back to log in
        </Link>
      </JadeScreen>
    );
  }

  return (
    <JadeScreen>
      <ToneRow size="sm" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[34px] leading-tight font-extrabold tracking-[-0.03em]">Get started</h1>
        <p className="text-base text-[#cfe5dd]">Create your Thanh Việt account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#cfe5dd]">
          Name
          <input id="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={jadeInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#cfe5dd]">
          Email
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={jadeInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#cfe5dd]">
          Password
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="flex-1" />
      <Link href="/login" className={jadeSecondary}>
        I already have an account
      </Link>
    </JadeScreen>
  );
}

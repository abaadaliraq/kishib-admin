"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserSupabaseClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message || "Unable to sign in.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-300/80">KISHIB Admin</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-400">Secure access for administrators only.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-300">
            Email
            <input
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm text-slate-300">
            Password
            <input
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-500">
          <p>Use your Supabase admin credentials to log in.</p>
        </div>
      </div>
    </div>
  );
}

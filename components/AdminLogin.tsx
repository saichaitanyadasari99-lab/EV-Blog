"use client";

import { useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const login = async () => {
    setStatus("Signing in...");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/admin/new";
  };

  return (
    <section className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Only your configured admin account can publish content.
        </p>
        <div className="mt-5 space-y-3">
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white hover:bg-[var(--accent-strong)]"
            onClick={login}
          >
            Sign In
          </button>
          {status ? <p className="text-sm text-[var(--ink-soft)]">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}

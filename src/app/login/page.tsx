"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/discover";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Add your Supabase URL and key to .env.local first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = next.startsWith("/") ? next : "/discover";
  }

  return (
    <>
      <Nav />
      <main className="shell page">
        <div className="panel form-wrap">
          <span className="eyebrow">Welcome back</span>
          <h1>Good to see you.</h1>
          <p className="muted">Log in to continue your conversations.</p>
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            <button className="btn primary" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </button>
          </form>
          {message && <div className="status">{message}</div>}
          <p className="form-note">
            New here?{" "}
            <Link href="/signup" style={{ color: "var(--pink)", fontWeight: 700 }}>
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

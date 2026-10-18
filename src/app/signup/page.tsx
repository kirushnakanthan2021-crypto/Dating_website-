"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!adult) {
      setMessage("You must confirm that you are 18 or older.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase configuration is missing.");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });

    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }

    if (data.session) {
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: name.trim().slice(0, 60) || "New member",
          updated_at: new Date().toISOString(),
        });
      }
      window.location.href = "/profile";
      return;
    }

    setBusy(false);
    setMessage("Account created. Check your email for the confirmation link, open it to verify your email, then log in.");
  }

  return (
    <>
      <Nav />
      <main className="shell page">
        <div className="panel form-wrap">
          <span className="eyebrow">Your story starts here</span>
          <h1>Create your profile.</h1>
          <p className="muted">A few details to get started.</p>

          <form onSubmit={submit}>
            <div className="field">
              <label>Display name</label>
              <input
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should people call you?"
              />
            </div>
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
              <label>Password (at least 8 characters)</label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
              />
            </div>
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "start",
                fontSize: 13,
                lineHeight: 1.6,
                margin: "18px 0",
              }}
            >
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
                style={{ marginTop: 4 }}
              />
              I confirm I am 18 or older and agree to the{" "}
              <Link href="/terms" style={{ color: "var(--pink)" }}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" style={{ color: "var(--pink)" }}>
                Privacy Policy
              </Link>
              .
            </label>
            <button className="btn primary" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Creating account…" : "Create free account"}
            </button>
          </form>

          {message && <div className="status" role="status">{message}</div>}
          <p className="form-note">
            Already joined?{" "}
            <Link href="/login" style={{ color: "var(--pink)", fontWeight: 700 }}>
              Log in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

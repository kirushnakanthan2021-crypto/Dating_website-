"use client";

import { FormEvent, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [interests, setInterests] = useState("");
  const [message, setMessage] = useState("Connect Supabase to save your profile.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = createClient();
    if (!s) return;
    (async () => {
      const {
        data: { user },
      } = await s.auth.getUser();
      if (!user) {
        setMessage("Please log in first.");
        return;
      }
      const { data } = await s
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setName(
        data?.display_name || String(user.user_metadata?.display_name || "")
      );
      setAge(data?.age ? String(data.age) : "");
      setCity(data?.city || "");
      setBio(data?.bio || "");
      setPhoto(data?.photo_url || "");
      setInterests((data?.interests || []).join(", "));
      setMessage("Keep your profile kind, honest and respectful.");
    })();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    const s = createClient();
    if (!s) {
      setMessage("Add Supabase credentials to .env.local first.");
      return;
    }
    const {
      data: { user },
    } = await s.auth.getUser();
    if (!user) {
      setMessage("Please log in first.");
      return;
    }
    const n = Number(age);
    if (!Number.isInteger(n) || n < 18 || n > 120) {
      setMessage("This dating service is for adults aged 18+ only.");
      return;
    }
    setBusy(true);
    const interestList = interests
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 12);

    const { error } = await s.from("profiles").upsert({
      id: user.id,
      display_name: name.trim().slice(0, 60),
      age: n,
      city: city.trim() || null,
      bio: bio.trim() || null,
      photo_url: photo.trim() || null,
      interests: interestList,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    setMessage(error ? error.message : "Profile saved.");
  }

  async function signOut() {
    const s = createClient();
    await s?.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <Nav />
      <main className="shell page">
        <div className="panel form-wrap">
          <span className="eyebrow">Your profile</span>
          <h1>Tell your story.</h1>
          <p className="muted">
            Share a little about yourself. Never include sensitive private
            information.
          </p>
          <form onSubmit={save}>
            <div className="field">
              <label>Display name</label>
              <input
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Age (18+)</label>
              <input
                type="number"
                min={18}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>City or area</label>
              <input
                maxLength={100}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Colombo"
              />
            </div>
            <div className="field">
              <label>Photo URL</label>
              <input
                type="url"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://…"
              />
              <span className="form-note">
                This starter accepts a photo URL. Secure image uploads will need
                Supabase Storage policies.
              </span>
            </div>
            <div className="field">
              <label>Interests (comma separated)</label>
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Coffee, Hiking, Music, Books"
                maxLength={200}
              />
            </div>
            <div className="field">
              <label>About me</label>
              <textarea
                rows={4}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What do you enjoy? What matters to you?"
              />
            </div>
            <button
              className="btn primary"
              style={{ width: "100%" }}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save profile"}
            </button>
          </form>
          {message && <div className="status">{message}</div>}
          <button
            className="btn secondary"
            onClick={signOut}
            style={{ width: "100%", marginTop: 8 }}
          >
            Log out
          </button>
        </div>
      </main>
    </>
  );
}

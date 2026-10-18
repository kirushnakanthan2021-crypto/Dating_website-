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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
    let photoUrl = photo.trim() || null;
    if (photoFile) {
      if (photoFile.size > 5 * 1024 * 1024) {
        setBusy(false);
        setMessage("Photo must be 5 MB or smaller.");
        return;
      }
      const extensions: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      const extension = extensions[photoFile.type];
      if (!extension) {
        setBusy(false);
        setMessage("Choose a JPG, PNG, WEBP or GIF image.");
        return;
      }
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await s.storage
        .from("profile-photos")
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
      if (uploadError) {
        setBusy(false);
        setMessage(`Photo upload failed: ${uploadError.message}`);
        return;
      }
      photoUrl = s.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
    }
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
      photo_url: photoUrl,
      interests: interestList,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (!error && photoUrl) {
      setPhoto(photoUrl);
      setPhotoFile(null);
    }
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Profile saved. Opening Discover…");
    window.location.href = "/discover";
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
              <label>Profile photo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              <span className="form-note">
                JPG, PNG, WEBP or GIF · max 5 MB. You can also paste an existing
                image URL below.
              </span>
              <input
                type="url"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://… (optional)"
              />
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

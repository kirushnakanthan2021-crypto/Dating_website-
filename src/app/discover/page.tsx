"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { createClient, type Profile } from "@/lib/supabase";
import SafetyActions from "@/components/SafetyActions";

const demo: Profile[] = [
  {
    id: "demo-1",
    display_name: "Maya",
    age: 27,
    city: "Colombo",
    bio: "Coffee walks, ocean sunsets and finding a new favourite book.",
    photo_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
    interests: ["Coffee", "Books"],
  },
  {
    id: "demo-2",
    display_name: "Noah",
    age: 29,
    city: "Kandy",
    bio: "Weekend hikes, cooking something new and good conversation.",
    photo_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
    interests: ["Hiking", "Food"],
  },
  {
    id: "demo-3",
    display_name: "Ava",
    age: 26,
    city: "Galle",
    bio: "Creative soul who loves the sea, music and spontaneous trips.",
    photo_url:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80",
    interests: ["Music", "Travel"],
  },
];

export default function DiscoverPage() {
  const [people, setPeople] = useState<Profile[]>(demo);
  const [message, setMessage] = useState(
    "Sample profiles are shown until Supabase is configured."
  );
  const [busy, setBusy] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const s = createClient();
    if (!s) return;
    let alive = true;

    (async () => {
      const {
        data: { user },
      } = await s.auth.getUser();
      if (!user) {
        setMessage("Sample profiles shown. Log in to use likes and matching.");
        return;
      }

      // Load people I already liked so we can hide / mark them
      const { data: myLikes } = await s
        .from("likes")
        .select("liked_id")
        .eq("liker_id", user.id);
      const liked = new Set((myLikes || []).map((r) => r.liked_id as string));
      if (alive) setLikedIds(liked);

      const { data, error } = await s
        .from("profiles")
        .select("id,display_name,age,city,bio,photo_url,interests")
        .neq("id", user.id)
        .limit(40);

      if (!alive) return;
      if (error) {
        setMessage("Could not load profiles. Run supabase/schema.sql first.");
        return;
      }

      // Prefer showing people not yet liked
      const list = ((data || []) as Profile[]).filter((p) => !liked.has(p.id));
      setPeople(list.length ? list : ((data || []) as Profile[]));
      setMessage(
        list.length
          ? "Community profiles"
          : data?.length
            ? "You've already liked everyone currently available. Check back later."
            : "No profiles yet. Check back after people join."
      );
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function like(p: Profile) {
    const s = createClient();
    if (!s) {
      setMessage("Connect Supabase to save likes.");
      return;
    }
    setBusy(true);
    const {
      data: { user },
    } = await s.auth.getUser();
    if (!user) {
      setBusy(false);
      window.location.href = "/login";
      return;
    }
    if (p.id.startsWith("demo-")) {
      setMessage("These are sample profiles, so they cannot be liked.");
      setBusy(false);
      return;
    }

    const { error } = await s
      .from("likes")
      .upsert(
        { liker_id: user.id, liked_id: p.id },
        { onConflict: "liker_id,liked_id" }
      );

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setLikedIds((prev) => new Set(prev).add(p.id));
    setPeople((prev) => prev.filter((x) => x.id !== p.id));
    setMessage("Like saved! If they like you back, you’ll match.");
  }

  return (
    <>
      <Nav />
      <main className="shell page">
        <span className="eyebrow">Discover</span>
        <h1 className="page-title" style={{ marginTop: 16 }}>
          People worth meeting.
        </h1>
        <p className="muted">
          Read their story and send a like if you feel a spark.
        </p>
        {message && <div className="status">{message}</div>}
        <div className="grid-cards">
          {people.map((p) => (
            <article className="person" key={p.id}>
              <img
                src={
                  p.photo_url ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80"
                }
                alt={"Profile of " + p.display_name}
              />
              <div className="person-body">
                <h3>
                  {p.display_name}
                  {p.age ? ", " + p.age : ""}
                </h3>
                <div className="small">📍 {p.city || "Location not added"}</div>
                <p>{p.bio || "Still writing their story."}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(p.interests || []).slice(0, 4).map((x) => (
                    <span className="pill" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
                <div className="actions">
                  <button
                    className="btn primary"
                    disabled={busy || likedIds.has(p.id)}
                    onClick={() => like(p)}
                  >
                    {likedIds.has(p.id) ? "Liked ✓" : "♥ Like"}
                  </button>
                </div>
                <SafetyActions targetId={p.id} />
              </div>
            </article>
          ))}
        </div>
        <p className="site-warning" style={{ marginTop: 22 }}>
          Sample profiles are illustrative, not real users. Never present them
          as real members.
        </p>
      </main>
    </>
  );
}

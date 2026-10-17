"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient, type Profile } from "@/lib/supabase";

type MatchView = {
  id: string;
  created_at: string;
  other: Profile | null;
};

export default function MatchesPage() {
  const [rows, setRows] = useState<MatchView[]>([]);
  const [message, setMessage] = useState("Loading your matches…");

  useEffect(() => {
    const s = createClient();
    if (!s) {
      setMessage("Connect Supabase to view matches.");
      return;
    }

    (async () => {
      const {
        data: { user },
      } = await s.auth.getUser();
      if (!user) {
        setMessage("Log in to see your matches.");
        return;
      }

      const { data: matches, error } = await s
        .from("matches")
        .select("id, created_at, user_a, user_b")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Could not load matches. Run the database schema first.");
        return;
      }

      if (!matches?.length) {
        setRows([]);
        setMessage(
          "No matches yet. Like someone in Discover and see if it’s mutual."
        );
        return;
      }

      const otherIds = matches.map((m) =>
        m.user_a === user.id ? m.user_b : m.user_a
      );

      const { data: profiles } = await s
        .from("profiles")
        .select("id,display_name,age,city,bio,photo_url,interests")
        .in("id", otherIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p as Profile])
      );

      const views: MatchView[] = matches.map((m) => {
        const otherId = m.user_a === user.id ? m.user_b : m.user_a;
        return {
          id: m.id,
          created_at: m.created_at,
          other: profileMap.get(otherId) || null,
        };
      });

      setRows(views);
      setMessage("Your mutual connections");
    })();
  }, []);

  return (
    <>
      <Nav />
      <main className="shell page">
        <span className="eyebrow">The spark is mutual</span>
        <h1 className="page-title" style={{ marginTop: 16 }}>
          Your matches
        </h1>
        <p className="muted">Connections happen when you both show interest.</p>

        {rows.length ? (
          <div className="list" style={{ marginTop: 24 }}>
            {rows.map((m) => (
              <div className="list-item" key={m.id}>
                {m.other?.photo_url ? (
                  <img
                    className="avatar"
                    src={m.other.photo_url}
                    alt={m.other.display_name}
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="avatar">♥</div>
                )}
                <div className="grow">
                  <strong>
                    {m.other
                      ? `${m.other.display_name}${m.other.age ? `, ${m.other.age}` : ""}`
                      : "New match"}
                  </strong>
                  <div className="small">
                    {m.other?.city ? `📍 ${m.other.city} · ` : ""}
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link className="btn primary" href={`/chat/${m.id}`}>
                    Open chat
                  </Link>
                  <Link className="btn secondary" href={`/calls/${m.id}`}>
                    Call
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}>
            <div style={{ fontSize: 32 }}>💗</div>
            <p>{message}</p>
            <Link className="btn primary" href="/discover">
              Discover people
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

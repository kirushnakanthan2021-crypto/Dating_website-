"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function SafetyActions({ targetId }: { targetId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(kind: "block" | "report") {
    if (targetId.startsWith("demo-")) {
      setMessage("Sample profiles cannot be blocked or reported.");
      return;
    }
    const s = createClient();
    if (!s) { setMessage("Configure Supabase first."); return; }
    const { data: { user } } = await s.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    if (user.id === targetId) { setMessage("You cannot take this action on your own profile."); return; }
    setBusy(true);
    if (kind === "block") {
      const { error } = await s.from("blocks").upsert({ blocker_id: user.id, blocked_id: targetId });
      setMessage(error ? error.message : "User blocked. Add server-side block enforcement before public launch.");
    } else {
      const reason = window.prompt("Why are you reporting this profile? (e.g. fake profile, harassment, scam)");
      if (!reason || reason.trim().length < 3) { setBusy(false); return; }
      const { error } = await s.from("reports").insert({ reporter_id: user.id, reported_id: targetId, reason: reason.trim().slice(0, 100) });
      setMessage(error ? error.message : "Report submitted for review.");
    }
    setBusy(false);
  }

  return <div style={{marginTop:12}}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <button className="btn secondary" disabled={busy} onClick={() => act("block")}>Block</button>
      <button className="btn secondary" disabled={busy} onClick={() => act("report")}>Report</button>
    </div>
    {message && <div className="form-note" style={{marginTop:8}}>{message}</div>}
  </div>;
}

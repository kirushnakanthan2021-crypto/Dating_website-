"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase";

export default function CallPage() {
  const params = useParams<{ id: string }>();
  const localVideo = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState("Sign in and open a valid match before a call can be set up.");
  const [mediaReady, setMediaReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = createClient();
    if (!s) return;
    let alive = true;
    s.auth.getUser().then(async ({ data: { user } }) => {
      if (!alive) return;
      if (!user) { setMessage("Please log in first."); return; }
      const { data, error } = await s.from("matches").select("id").eq("id", params.id).maybeSingle();
      if (error || !data) setMessage("A valid match is required before starting a call.");
      else setMessage("Match verified. Camera preview can be tested; remote call signaling is not configured in this starter.");
    });
    return () => { alive = false; };
  }, [params.id]);

  async function testCamera() {
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideo.current) localVideo.current.srcObject = stream;
      setMediaReady(true);
      setMessage("Your local camera and microphone are ready. This starter does not yet connect the other person.");
    } catch {
      setMessage("Camera/microphone permission was denied or is unavailable. Allow access in browser settings and use HTTPS.");
    } finally { setBusy(false); }
  }

  function stopCamera() {
    const stream = localVideo.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(track => track.stop());
    if (localVideo.current) localVideo.current.srcObject = null;
    setMediaReady(false);
    setMessage("Camera and microphone stopped.");
  }

  useEffect(() => () => {
    const stream = localVideo.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(track => track.stop());
  }, []);

  return <><Nav/><main className="shell page"><Link href="/matches" className="muted">← Back to matches</Link><h1 className="page-title" style={{marginTop:16}}>Video call</h1><p className="muted">Private calls should only be started with someone you matched with.</p><div className="panel" style={{maxWidth:760,marginTop:20}}><div style={{background:"#211923",borderRadius:18,minHeight:280,display:"grid",placeItems:"center",overflow:"hidden",position:"relative"}}><video ref={localVideo} autoPlay muted playsInline style={{width:"100%",maxHeight:460,objectFit:"cover"}}/><div style={{position:"absolute",bottom:14,left:14,background:"#0009",color:"white",padding:"7px 10px",borderRadius:10,fontSize:12}}>{mediaReady?"Your camera preview":"Remote video will appear after WebRTC signaling is connected"}</div></div><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}><button className="btn primary" disabled={busy||mediaReady} onClick={testCamera}>{busy?"Requesting access…":"Test camera & microphone"}</button><button className="btn secondary" disabled={!mediaReady} onClick={stopCamera}>Stop camera</button></div>{message&&<div className="status">{message}</div>}<p className="site-warning">This page only tests local camera/microphone access. Real person-to-person video requires authenticated WebRTC signaling, private Realtime authorization and a TURN server; do not treat this as a working video call yet.</p></div></main></>;
}

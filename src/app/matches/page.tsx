"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase";

type MatchRow={id:string;created_at:string};
export default function MatchesPage(){const [rows,setRows]=useState<MatchRow[]>([]);const [message,setMessage]=useState("Loading your matches…");
useEffect(()=>{const s=createClient();if(!s){setMessage("Connect Supabase to view matches.");return;}(async()=>{const {data:{user}}=await s.auth.getUser();if(!user){setMessage("Log in to see your matches.");return;}const {data,error}=await s.from("matches").select("id,created_at").or("user_a.eq."+user.id+",user_b.eq."+user.id).order("created_at",{ascending:false});if(error){setMessage("Could not load matches. Run the database schema first.");return;}setRows((data||[]) as MatchRow[]);setMessage(data?.length?"Your mutual connections":"No matches yet. Like someone in Discover and see if it’s mutual.");})();},[]);
return <><Nav/><main className="shell page"><span className="eyebrow">The spark is mutual</span><h1 className="page-title" style={{marginTop:16}}>Your matches</h1><p className="muted">Connections happen when you both show interest.</p>{rows.length?<div className="list" style={{marginTop:24}}>{rows.map(m=><div className="list-item" key={m.id}><div className="avatar">♥</div><div className="grow"><strong>New match</strong><div className="small">{new Date(m.created_at).toLocaleDateString()}</div></div><Link className="btn primary" href={"/chat/"+m.id}>Open chat</Link></div>)}</div>:<div className="empty" style={{marginTop:24}}><div style={{fontSize:32}}>💗</div><p>{message}</p><Link className="btn primary" href="/discover">Discover people</Link></div>}</main></>;
}

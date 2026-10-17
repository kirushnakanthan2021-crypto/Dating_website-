"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function Nav() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) =>
      setSignedIn(Boolean(data.session))
    );
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSignedIn(Boolean(session))
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <header className="shell nav">
      <Link className="brand" href="/">
        pairly<span>♥</span>
      </Link>
      <nav className="navlinks">
        <Link className="hide-mobile" href="/discover">
          Discover
        </Link>
        {signedIn && (
          <>
            <Link className="optional" href="/matches">
              Matches
            </Link>
            <Link className="optional" href="/premium">
              Premium
            </Link>
          </>
        )}
        <Link
          className="btn primary"
          href={signedIn ? "/profile" : "/login"}
        >
          {signedIn ? "My profile" : "Log in"}
        </Link>
      </nav>
    </header>
  );
}

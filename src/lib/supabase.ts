"use client";

import { createBrowserClient } from "@supabase/ssr";

// Public Supabase project settings. Environment variables override these defaults.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://fqexkacmpzvcugpznxxz.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_cB1rMFeV5tgOd-hfRf0lkQ_DowURIbn";

export function createClient() {
  return createBrowserClient(url, key);
}

export type Profile = {
  id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  photo_url: string | null;
  interests: string[] | null;
  created_at?: string;
  updated_at?: string;
};

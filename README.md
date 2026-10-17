# Pairly — Dating Website

A mobile-first dating website built with **Next.js 15**, **React 19**, **TypeScript** and **Supabase**.

## Features

- Landing page + responsive design
- Supabase Auth (signup / login / email verification callback)
- Auto profile creation on signup
- Profile editing (name, age, city, bio, interests) + Supabase Storage profile photo uploads (JPG/PNG/WEBP/GIF, max 5 MB)
- Discover feed with like system
- Mutual match automation (database trigger)
- Matches list showing the other person’s name & photo
- Realtime private chat
- Block & report controls
- Local camera/microphone test page (WebRTC signaling not included)
- Premium & Admin placeholders
- Safety, Privacy and Terms pages
- Row Level Security + production hardening SQL
- Middleware protecting private routes

## Setup

1. Install **Node.js 20.9+**
2. Clone the repo and run:
   ```bash
   npm install
   ```
3. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
4. Create a free project at [https://database.new](https://database.new) (Supabase)
5. Put these values in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
6. In Supabase SQL Editor run:
   - `supabase/schema.sql`
   - then `supabase/production_hardening.sql`
7. In Supabase → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
8. Start the app:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## How matching works

1. User A likes User B → row in `likes`
2. If User B also likes User A → trigger creates a row in `matches`
3. Both users see each other on `/matches` and can open chat

## Important limitations (read before launch)

- Profile photos use the public `profile-photos` bucket; uploads are limited to 5 MB and each signed-in member can write only inside their own user-id folder. Do not upload identity documents or sensitive images.
- Discover demo profiles are illustrative, not real users.
- Video calls only test local camera/mic. Full WebRTC + TURN is not implemented.
- Payments / Premium are placeholders (no real billing).
- Admin page is a placeholder — needs server-side role checks.
- Add age verification, moderation, rate limits, accessibility and security review before public launch.

## Security notes

- Never commit `.env.local` or service-role keys.
- Review every RLS policy before storing real member data.
- Do not trust browser-submitted subscription status.

## Project structure

```
src/
  app/           # pages (landing, discover, matches, chat, profile…)
  components/    # Nav, SafetyActions
  lib/           # Supabase browser + server clients
middleware.ts    # protects /profile, /matches, /chat, /calls, /admin
supabase/        # schema.sql + production_hardening.sql
```

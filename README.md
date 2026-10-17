# Pairly — Dating Website Starter

A mobile-first dating website starter using Next.js 15, React 19, TypeScript and Supabase.

## Included
- Responsive landing page and styling
- Supabase Auth signup/login
- Profile editing, discovery and likes
- Matches list and realtime chat starter
- Premium page placeholder (no payment collected)
- Local camera/microphone test page (remote WebRTC calling not connected)
- Admin placeholder, safety, privacy and terms draft pages
- SQL schema for profiles, likes, matches, messages, blocks, reports and subscriptions

## Run locally
1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project at https://database.new.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
5. Run `supabase/schema.sql` in Supabase SQL Editor.
6. Configure email verification and redirect URLs in Supabase Auth.
7. Run `npm install` and `npm run dev`, then open http://localhost:3000.

## Important limitations
This is a starter, not production-ready. Photo upload currently accepts a URL; add Supabase Storage upload policies. Discover demo profiles are illustrative, not real users. Chat needs block enforcement, abuse controls and rate limits. Video calls need WebRTC, authenticated signaling and TURN. Payments need a supported provider and server-verified signed webhooks. Admin page is a placeholder and needs server-side role checks. Privacy/terms drafts need local legal review. Add production age assurance, account deletion/export, moderation, spam protection, accessibility and security testing before launch.

## Security
Never commit `.env.local`, service-role keys or payment secrets. Review every RLS policy before storing real member data. Do not trust browser-submitted subscription status. The profile read policy is prototype-level and must be narrowed before public launch.
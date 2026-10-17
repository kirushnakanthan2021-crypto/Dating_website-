-- Pairly dating app starter schema. Run in Supabase SQL Editor.
-- Review every policy before using real member data.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  age int check (age is null or age between 18 and 120),
  city text,
  bio text check (bio is null or char_length(bio) <= 500),
  photo_url text,
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  liker_id uuid not null references public.profiles(id) on delete cascade,
  liked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(liker_id, liked_id),
  check (liker_id <> liked_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a <> user_b),
  unique(user_a, user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 100),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null default 'inactive' check (status in ('inactive','active','past_due','cancelled','expired')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists likes_liked_idx on public.likes(liked_id);
create index if not exists messages_match_created_idx on public.messages(match_id, created_at);
create index if not exists reports_status_idx on public.reports(status, created_at);

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "users create own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users delete own profile" on public.profiles for delete to authenticated using (auth.uid() = id);

create policy "users see likes they sent or received" on public.likes for select to authenticated using (auth.uid() = liker_id or auth.uid() = liked_id);
create policy "users create own likes" on public.likes for insert to authenticated with check (auth.uid() = liker_id);
create policy "users remove own likes" on public.likes for delete to authenticated using (auth.uid() = liker_id);

create policy "matched users can see their matches" on public.matches for select to authenticated using (auth.uid() = user_a or auth.uid() = user_b);
create policy "participants can read messages" on public.messages for select to authenticated using (exists (select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())));
create policy "participants can send messages to matches" on public.messages for insert to authenticated with check (auth.uid() = sender_id and exists (select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())));

create policy "users see own blocks" on public.blocks for select to authenticated using (auth.uid() = blocker_id);
create policy "users create own blocks" on public.blocks for insert to authenticated with check (auth.uid() = blocker_id);
create policy "users remove own blocks" on public.blocks for delete to authenticated using (auth.uid() = blocker_id);

create policy "users create reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "users see own submitted reports" on public.reports for select to authenticated using (auth.uid() = reporter_id);

create policy "users see own subscription status" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
-- Subscription rows must only be written by a trusted server/webhook, never the browser.

create or replace function public.create_match_on_mutual_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare low_id uuid; high_id uuid;
begin
  if exists (select 1 from public.likes where liker_id = new.liked_id and liked_id = new.liker_id) then
    low_id := least(new.liker_id, new.liked_id);
    high_id := greatest(new.liker_id, new.liked_id);
    insert into public.matches(user_a, user_b) values (low_id, high_id) on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists likes_mutual_match on public.likes;
create trigger likes_mutual_match after insert on public.likes for each row execute function public.create_match_on_mutual_like();

-- Enable public.messages in the Supabase Realtime publication if required.
-- Storage policies, block-aware discovery/message enforcement, admin roles and call signaling
-- must be implemented before launch. Do not treat this starter schema as production-ready.

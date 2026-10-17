-- Pairly security hardening + mutual-match automation.
-- Run AFTER schema.sql in Supabase SQL Editor.
-- Review with a security professional before production use.

-- Drop prototype policies so this migration can replace them safely.
drop policy if exists "profiles readable by authenticated users" on public.profiles;
drop policy if exists "users create own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "users delete own profile" on public.profiles;
drop policy if exists "users see likes they sent or received" on public.likes;
drop policy if exists "users create own likes" on public.likes;
drop policy if exists "users remove own likes" on public.likes;
drop policy if exists "matched users can see their matches" on public.matches;
drop policy if exists "participants can read messages" on public.messages;
drop policy if exists "participants can send messages" on public.messages;
drop policy if exists "users see own blocks" on public.blocks;
drop policy if exists "users manage own blocks" on public.blocks;
drop policy if exists "users create reports" on public.reports;
drop policy if exists "users read own reports" on public.reports;
drop policy if exists "users read own subscription" on public.subscriptions;

-- Blocks are private to the person who created them.
drop policy if exists "blocker can read own blocks" on public.blocks;
drop policy if exists "blocker can create own blocks" on public.blocks;
drop policy if exists "blocker can remove own blocks" on public.blocks;

create policy "profiles visible excluding blocked users"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or (
    not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = profiles.id)
         or (b.blocker_id = profiles.id and b.blocked_id = auth.uid())
    )
  )
);
create policy "users create own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users delete own profile" on public.profiles
for delete to authenticated using (auth.uid() = id);

create policy "users see likes they sent or received" on public.likes
for select to authenticated using (auth.uid() = liker_id or auth.uid() = liked_id);
create policy "users create own likes" on public.likes
for insert to authenticated with check (
  auth.uid() = liker_id
  and not exists (
    select 1 from public.blocks b
    where (b.blocker_id = liker_id and b.blocked_id = liked_id)
       or (b.blocker_id = liked_id and b.blocked_id = liker_id)
  )
);
create policy "users remove own likes" on public.likes
for delete to authenticated using (auth.uid() = liker_id);

create policy "matched users can see their matches" on public.matches
for select to authenticated using (auth.uid() = user_a or auth.uid() = user_b);

create policy "participants can read messages" on public.messages
for select to authenticated using (
  exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = m.user_a and b.blocked_id = m.user_b)
           or (b.blocker_id = m.user_b and b.blocked_id = m.user_a)
      )
  )
);
create policy "participants can send messages" on public.messages
for insert to authenticated with check (
  sender_id = auth.uid()
  and char_length(trim(body)) between 1 and 2000
  and exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = m.user_a and b.blocked_id = m.user_b)
           or (b.blocker_id = m.user_b and b.blocked_id = m.user_a)
      )
  )
);

create policy "blocker can read own blocks" on public.blocks
for select to authenticated using (blocker_id = auth.uid());
create policy "blocker can create own blocks" on public.blocks
for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocker can remove own blocks" on public.blocks
for delete to authenticated using (blocker_id = auth.uid());

create policy "users create reports" on public.reports
for insert to authenticated with check (
  reporter_id = auth.uid()
  and reported_id <> auth.uid()
);
create policy "users read own reports" on public.reports
for select to authenticated using (reporter_id = auth.uid());

create policy "users read own subscription" on public.subscriptions
for select to authenticated using (user_id = auth.uid());
-- Intentionally no client-side insert/update/delete policy for subscriptions:
-- only a trusted server/webhook should change payment state.

-- A mutual like creates one canonical match row. This function runs with
-- tightly scoped definer rights so clients cannot insert arbitrary matches.
create or replace function public.create_match_on_mutual_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  has_reverse_like boolean;
  first_user uuid;
  second_user uuid;
begin
  select exists (
    select 1 from public.likes l
    where l.liker_id = new.liked_id and l.liked_id = new.liker_id
  ) into has_reverse_like;

  if has_reverse_like then
    first_user := least(new.liker_id, new.liked_id);
    second_user := greatest(new.liker_id, new.liked_id);
    insert into public.matches (user_a, user_b)
    values (first_user, second_user)
    on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists likes_create_mutual_match on public.likes;
create trigger likes_create_mutual_match
after insert on public.likes
for each row execute function public.create_match_on_mutual_like();

-- Clients must never create or edit match rows directly.
drop policy if exists "clients cannot create matches" on public.matches;
drop policy if exists "clients cannot update matches" on public.matches;
drop policy if exists "clients cannot delete matches" on public.matches;
create policy "clients cannot create matches" on public.matches
for insert to authenticated with check (false);
create policy "clients cannot update matches" on public.matches
for update to authenticated using (false);
create policy "clients cannot delete matches" on public.matches
for delete to authenticated using (false);

-- Ensure public users cannot use a browser session to mutate billing records.
drop policy if exists "users insert own subscriptions" on public.subscriptions;
drop policy if exists "users update own subscriptions" on public.subscriptions;
drop policy if exists "users delete own subscriptions" on public.subscriptions;


-- Final cleanup: remove legacy policy names left by earlier starter versions.
drop policy if exists "participants can send messages to matches" on public.messages;
drop policy if exists "users see own submitted reports" on public.reports;
drop policy if exists "users see own subscription status" on public.subscriptions;
drop policy if exists "users read own submitted reports" on public.reports;
drop policy if exists "users read own subscription" on public.subscriptions;
drop policy if exists "users create own blocks" on public.blocks;
drop policy if exists "users remove own blocks" on public.blocks;

-- The mutual-like function is trigger-only, not a public RPC endpoint.
revoke execute on function public.create_match_on_mutual_like() from public, anon, authenticated;

-- Index foreign-key columns used by joins and moderation queries.
create index if not exists blocks_blocked_id_idx on public.blocks(blocked_id);
create index if not exists matches_user_b_idx on public.matches(user_b);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists reports_reported_id_idx on public.reports(reported_id);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- Enable Realtime delivery for chat messages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Restore read-only access to the signed-in user's subscription status.
drop policy if exists "users read own subscription" on public.subscriptions;
create policy "users read own subscription" on public.subscriptions
for select to authenticated using (user_id = (select auth.uid()));

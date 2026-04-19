-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.tricks enable row level security;
alter table public.trick_aliases enable row level security;
alter table public.clips enable row level security;
alter table public.clip_tricks enable row level security;
alter table public.clip_votes enable row level security;
alter table public.clip_favorites enable row level security;
alter table public.clip_reports enable row level security;
alter table public.trick_requests enable row level security;

-- ---- USERS ----
create policy "Users: public read" on public.users
  for select using (true);

create policy "Users: update own" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- TRICKS ----
create policy "Tricks: public read" on public.tricks
  for select using (true);

create policy "Tricks: admin insert" on public.tricks
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Tricks: admin update" on public.tricks
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ---- TRICK ALIASES ----
create policy "Trick aliases: public read" on public.trick_aliases
  for select using (true);

create policy "Trick aliases: admin insert" on public.trick_aliases
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Trick aliases: admin update" on public.trick_aliases
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Trick aliases: admin delete" on public.trick_aliases
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ---- CLIPS ----
create policy "Clips: public read active" on public.clips
  for select using (status = 'active');

create policy "Clips: admin read all" on public.clips
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Clips: authenticated insert" on public.clips
  for insert with check (auth.uid() = user_id);

create policy "Clips: admin update" on public.clips
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ---- CLIP TRICKS ----
create policy "Clip tricks: public read" on public.clip_tricks
  for select using (true);

create policy "Clip tricks: owner insert" on public.clip_tricks
  for insert with check (
    exists (select 1 from public.clips where id = clip_id and user_id = auth.uid())
  );

-- ---- CLIP VOTES ----
create policy "Clip votes: public read" on public.clip_votes
  for select using (true);

create policy "Clip votes: own insert" on public.clip_votes
  for insert with check (auth.uid() = user_id);

create policy "Clip votes: own update" on public.clip_votes
  for update using (auth.uid() = user_id);

create policy "Clip votes: own delete" on public.clip_votes
  for delete using (auth.uid() = user_id);

-- ---- CLIP FAVORITES ----
create policy "Clip favorites: own read" on public.clip_favorites
  for select using (auth.uid() = user_id);

create policy "Clip favorites: own insert" on public.clip_favorites
  for insert with check (auth.uid() = user_id);

create policy "Clip favorites: own delete" on public.clip_favorites
  for delete using (auth.uid() = user_id);

-- ---- CLIP REPORTS ----
create policy "Clip reports: own insert" on public.clip_reports
  for insert with check (auth.uid() = user_id);

create policy "Clip reports: admin read" on public.clip_reports
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Clip reports: admin update" on public.clip_reports
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ---- TRICK REQUESTS ----
create policy "Trick requests: own insert" on public.trick_requests
  for insert with check (auth.uid() = user_id);

create policy "Trick requests: own read" on public.trick_requests
  for select using (auth.uid() = user_id);

create policy "Trick requests: admin read" on public.trick_requests
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Trick requests: admin update" on public.trick_requests
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- Storage policies for clips bucket
-- ============================================================
-- Note: Run these in the Supabase dashboard SQL editor since
-- storage schema may not be available in migrations.
--
-- insert into storage.buckets (id, name, public) values ('clips', 'clips', true);
-- insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);
--
-- create policy "Clips storage: public read" on storage.objects
--   for select using (bucket_id in ('clips', 'thumbnails'));
--
-- create policy "Clips storage: authenticated upload" on storage.objects
--   for insert with check (bucket_id in ('clips', 'thumbnails') and auth.role() = 'authenticated');

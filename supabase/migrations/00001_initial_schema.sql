-- ============================================================
-- TrickDB Initial Schema
-- ============================================================

-- 1. Users table (extends Supabase Auth)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Tricks table (canonical trick list)
create table public.tricks (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  normalized_name text unique not null,
  slug text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_tricks_normalized_name on public.tricks (normalized_name);
create index idx_tricks_slug on public.tricks (slug);

-- 3. Trick aliases
create table public.trick_aliases (
  id uuid primary key default gen_random_uuid(),
  trick_id uuid not null references public.tricks(id) on delete cascade,
  alias text not null,
  normalized_alias text unique not null,
  created_at timestamptz not null default now()
);

create index idx_trick_aliases_normalized on public.trick_aliases (normalized_alias);
create index idx_trick_aliases_trick_id on public.trick_aliases (trick_id);

-- 4. Clips table
create table public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  storage_path text not null,
  thumbnail_path text,
  performer_name text,
  duration_seconds integer not null,
  file_size_bytes bigint not null,
  mime_type text not null,
  status text not null default 'active' check (status in ('active', 'hidden', 'removed')),
  content_hash text,
  created_at timestamptz not null default now()
);

create index idx_clips_user_id on public.clips (user_id);
create index idx_clips_status on public.clips (status);
create index idx_clips_created_at on public.clips (created_at desc);

-- 5. Clip-trick associations (many-to-many, 1-3 per clip)
create table public.clip_tricks (
  clip_id uuid not null references public.clips(id) on delete cascade,
  trick_id uuid not null references public.tricks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clip_id, trick_id)
);

create index idx_clip_tricks_trick_id on public.clip_tricks (trick_id);

-- 6. Clip votes
create table public.clip_votes (
  user_id uuid not null references public.users(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, clip_id)
);

create index idx_clip_votes_clip_id on public.clip_votes (clip_id);

-- 7. Clip favorites
create table public.clip_favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clip_id)
);

create index idx_clip_favorites_user_id on public.clip_favorites (user_id);

-- 8. Clip reports
create table public.clip_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  reason text not null check (reason in (
    'wrong_trick', 'not_a_trick', 'inappropriate',
    'duplicate', 'low_quality', 'stolen_content', 'dangerous_technique'
  )),
  notes text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now()
);

create index idx_clip_reports_status on public.clip_reports (status);
create index idx_clip_reports_clip_id on public.clip_reports (clip_id);

-- 9. Trick requests
create table public.trick_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trick_name text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index idx_trick_requests_status on public.trick_requests (status);

-- ============================================================
-- Views
-- ============================================================

-- Clip score view
create or replace view public.clip_scores as
select
  c.id as clip_id,
  coalesce(sum(v.value), 0) as score,
  coalesce(count(v.value) filter (where v.value = 1), 0) as like_count,
  coalesce(count(v.value) filter (where v.value = -1), 0) as dislike_count
from public.clips c
left join public.clip_votes v on v.clip_id = c.id
group by c.id;

-- Trick weekly score view (for homepage ranking)
create or replace view public.trick_weekly_scores as
select
  t.id as trick_id,
  t.name,
  t.slug,
  coalesce(sum(v.value) filter (where v.created_at >= now() - interval '7 days'), 0) as weekly_vote_score,
  count(distinct c.id) filter (where c.created_at >= now() - interval '7 days') as weekly_upload_count
from public.tricks t
left join public.clip_tricks ct on ct.trick_id = t.id
left join public.clips c on c.id = ct.clip_id and c.status = 'active'
left join public.clip_votes v on v.clip_id = c.id
where t.is_active = true
group by t.id, t.name, t.slug;

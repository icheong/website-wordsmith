-- ============================================================================
-- WordSmith Studio — Supabase schema
-- Run this whole file in the Supabase Dashboard → SQL Editor → New query.
--
-- Accounts are seeded manually (login only, no public sign-up):
--   Dashboard → Authentication → Users → "Add user"
--   Set "User metadata" to { "role": "parent", "display_name": "Mum" }
--   for the parent and { "role": "child", "display_name": "..." } for kids.
--   A trigger below turns each auth user into a profile row automatically.
-- ============================================================================

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'child' check (role in ('child', 'parent')),
  display_name text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'child'),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current caller the parent account?
create or replace function public.is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'parent'
  );
$$;

-- ------------------------------------------------------------ submissions --
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_type text not null default 'free_write'
    check (module_type in ('sentence_ladder', 'paragraph_builder', 'free_write')),
  image_url text,                                  -- Supabase Storage link for the scanned page
  typed_text text default '',
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reviewed')),
  created_at timestamptz not null default now(),

  -- Documented extensions to the base plan schema:
  title text,                                      -- name of the piece
  prompt_text text,                                -- active prompt carried into the workspace
  module_data jsonb,                               -- drill state (ladder steps / pillar fields)
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists submissions_touch on public.submissions;
create trigger submissions_touch
  before update on public.submissions
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------ annotations --
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  x_coord numeric not null check (x_coord between 0 and 100),  -- % across the scanned image
  y_coord numeric not null check (y_coord between 0 and 100),  -- % down the scanned image
  comment_text text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------- row level security -----
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.annotations enable row level security;

-- profiles: you can read your own profile; the parent can read everyone's
-- (needed to label submissions in the Reviews list).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_parent());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- submissions: owners get full CRUD; the parent can read and update all.
drop policy if exists "submissions_select" on public.submissions;
create policy "submissions_select" on public.submissions
  for select using (user_id = auth.uid() or public.is_parent());

drop policy if exists "submissions_insert" on public.submissions;
create policy "submissions_insert" on public.submissions
  for insert with check (user_id = auth.uid());

drop policy if exists "submissions_update" on public.submissions;
create policy "submissions_update" on public.submissions
  for update using (user_id = auth.uid() or public.is_parent());

drop policy if exists "submissions_delete" on public.submissions;
create policy "submissions_delete" on public.submissions
  for delete using (user_id = auth.uid() or public.is_parent());

-- annotations: anyone who can see the submission can read the pins.
-- Only the parent may write them (that is the whole point of the overlay).
drop policy if exists "annotations_select" on public.annotations;
create policy "annotations_select" on public.annotations
  for select using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and (s.user_id = auth.uid() or public.is_parent())
    )
  );

drop policy if exists "annotations_insert" on public.annotations;
create policy "annotations_insert" on public.annotations
  for insert with check (author_id = auth.uid() and public.is_parent());

drop policy if exists "annotations_update" on public.annotations;
create policy "annotations_update" on public.annotations
  for update using (author_id = auth.uid() or public.is_parent());

drop policy if exists "annotations_delete" on public.annotations;
create policy "annotations_delete" on public.annotations
  for delete using (author_id = auth.uid() or public.is_parent());

-- --------------------------------------------------- storage: notebook scans
insert into storage.buckets (id, name, public)
values ('notebook-scans', 'notebook-scans', true)
on conflict (id) do nothing;

drop policy if exists "scans_read" on storage.objects;
create policy "scans_read" on storage.objects
  for select using (bucket_id = 'notebook-scans');

drop policy if exists "scans_insert_own" on storage.objects;
create policy "scans_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'notebook-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "scans_delete_own" on storage.objects;
create policy "scans_delete_own" on storage.objects
  for delete using (
    bucket_id = 'notebook-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- Seeding / back-fill cheat sheet
-- ============================================================================
-- If a user was created without metadata, fix their profile manually:
--
--   update public.profiles
--   set role = 'parent', display_name = 'Mum'
--   where id = (select id from auth.users where email = 'parent@example.com');
--
--   update public.profiles
--   set role = 'child', display_name = 'Mia'
--   where id = (select id from auth.users where email = 'mia@example.com');
--
-- Verify:
--   select u.email, p.role, p.display_name
--   from auth.users u join public.profiles p on p.id = u.id;
-- ============================================================================

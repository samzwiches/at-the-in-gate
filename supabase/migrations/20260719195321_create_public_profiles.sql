create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  location text,
  avatar_path text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_length_check check (
    username is null or char_length(username) between 3 and 40
  ),
  constraint profiles_display_name_length_check check (
    display_name is null or char_length(display_name) <= 100
  ),
  constraint profiles_bio_length_check check (
    bio is null or char_length(bio) <= 1000
  ),
  constraint profiles_location_length_check check (
    location is null or char_length(location) <= 150
  ),
  constraint profiles_avatar_path_length_check check (
    avatar_path is null or char_length(avatar_path) <= 500
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

alter table public.profiles enable row level security;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

create policy "Public profiles are readable"
on public.profiles
for select
to anon, authenticated
using (is_public = true);

create policy "Authenticated users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Authenticated users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

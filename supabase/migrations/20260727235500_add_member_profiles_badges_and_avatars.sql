alter table public.profiles
  add column if not exists founding_member boolean not null default false;

update public.profiles as profile
set founding_member = true
where exists (
  select 1
  from public.membership_grants as membership_grant
  where membership_grant.profile_id = profile.id
    and membership_grant.grant_type = 'founding'
    and membership_grant.revoked_at is null
);

create or replace function public.grant_founding_access(
  p_email text,
  p_months integer default 12,
  p_note text default 'Founding member'
)
returns table (
  profile_id uuid,
  member_email text,
  grant_type text,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  if p_months < 1 or p_months > 120 then
    raise exception 'Grant months must be between 1 and 120.';
  end if;

  select auth_user.id
  into v_profile_id
  from auth.users as auth_user
  where lower(auth_user.email) = lower(trim(p_email))
  limit 1;

  if v_profile_id is null then
    raise exception 'No At The In Gate account exists for email %.', p_email;
  end if;

  insert into public.membership_grants (
    profile_id,
    grant_type,
    starts_at,
    ends_at,
    revoked_at,
    note
  )
  values (
    v_profile_id,
    'founding',
    now(),
    now() + make_interval(months => p_months),
    null,
    nullif(trim(p_note), '')
  )
  on conflict (profile_id) do update
  set
    grant_type = 'founding',
    starts_at = now(),
    ends_at = now() + make_interval(months => p_months),
    revoked_at = null,
    note = nullif(trim(p_note), '');

  update public.profiles
  set founding_member = true
  where id = v_profile_id;

  return query
  select
    membership_grant.profile_id,
    auth_user.email::text,
    membership_grant.grant_type,
    membership_grant.ends_at
  from public.membership_grants as membership_grant
  join auth.users as auth_user
    on auth_user.id = membership_grant.profile_id
  where membership_grant.profile_id = v_profile_id;
end;
$$;

revoke all
  on function public.grant_founding_access(text, integer, text)
  from public;

grant execute
  on function public.grant_founding_access(text, integer, text)
  to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public profile avatars are readable" on storage.objects;
drop policy if exists "Members can read their own profile avatar" on storage.objects;
drop policy if exists "Members can upload their own profile avatar" on storage.objects;
drop policy if exists "Members can update their own profile avatar" on storage.objects;
drop policy if exists "Members can delete their own profile avatar" on storage.objects;

create policy "Public profile avatars are readable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'profile-avatars'
  and exists (
    select 1
    from public.profiles as profile
    where profile.id::text = (storage.foldername(name))[1]
      and profile.is_public = true
  )
);

create policy "Members can read their own profile avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Members can upload their own profile avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy "Members can update their own profile avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy "Members can delete their own profile avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

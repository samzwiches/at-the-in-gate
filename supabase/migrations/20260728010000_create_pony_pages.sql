create table if not exists public.kids_creations (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  child_display_name text not null,
  child_age_group text not null default 'not-shared',
  category text not null,
  title text not null,
  body text,
  image_path text,
  image_alt_text text,
  guardian_attested boolean not null default false,
  moderation_status text not null default 'pending',
  moderated_at timestamptz,
  moderated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kids_creations_child_name_check check (
    char_length(trim(child_display_name)) between 1 and 40
  ),
  constraint kids_creations_age_group_check check (
    child_age_group in ('little-rider', '8-10', '11-13', '14-17', 'not-shared')
  ),
  constraint kids_creations_category_check check (
    category in ('story', 'drawing', 'comic', 'poem', 'show-memory', 'pony-tip')
  ),
  constraint kids_creations_title_check check (
    char_length(trim(title)) between 1 and 160
  ),
  constraint kids_creations_body_check check (
    body is null or char_length(trim(body)) between 1 and 8000
  ),
  constraint kids_creations_alt_text_check check (
    image_alt_text is null or char_length(trim(image_alt_text)) <= 300
  ),
  constraint kids_creations_content_check check (
    body is not null or image_path is not null
  ),
  constraint kids_creations_guardian_check check (guardian_attested = true),
  constraint kids_creations_moderation_check check (
    moderation_status in ('pending', 'published', 'hidden', 'removed')
  )
);

create table if not exists public.kids_creation_reactions (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.kids_creations(id) on delete cascade,
  profile_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),

  constraint kids_creation_reactions_type_check check (
    reaction_type in ('love-it', 'so-creative', 'great-job')
  ),
  constraint kids_creation_reactions_unique unique (creation_id, profile_id, reaction_type)
);

create index if not exists kids_creations_published_idx
  on public.kids_creations (created_at desc)
  where moderation_status = 'published';

create index if not exists kids_creations_parent_idx
  on public.kids_creations (parent_profile_id, created_at desc);

create index if not exists kids_creations_pending_idx
  on public.kids_creations (created_at asc)
  where moderation_status = 'pending';

create index if not exists kids_creation_reactions_creation_idx
  on public.kids_creation_reactions (creation_id, reaction_type);

drop trigger if exists set_kids_creations_updated_at on public.kids_creations;
create trigger set_kids_creations_updated_at
before update on public.kids_creations
for each row
execute function public.set_updated_at();

create or replace function private.set_kids_creation_moderation_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.moderation_status is distinct from old.moderation_status then
    new.moderated_at = now();
    new.moderated_by_profile_id = auth.uid();
  end if;

  return new;
end;
$$;

revoke all on function private.set_kids_creation_moderation_audit() from public;

drop trigger if exists set_kids_creation_moderation_audit on public.kids_creations;
create trigger set_kids_creation_moderation_audit
before update of moderation_status on public.kids_creations
for each row
execute function private.set_kids_creation_moderation_audit();

alter table public.kids_creations enable row level security;
alter table public.kids_creation_reactions enable row level security;

revoke all on public.kids_creations from anon, authenticated;
revoke all on public.kids_creation_reactions from anon, authenticated;

grant select on public.kids_creations to authenticated;
grant insert (
  id,
  parent_profile_id,
  child_display_name,
  child_age_group,
  category,
  title,
  body,
  image_path,
  image_alt_text,
  guardian_attested
) on public.kids_creations to authenticated;
grant update (
  child_display_name,
  child_age_group,
  category,
  title,
  body,
  image_path,
  image_alt_text,
  moderation_status
) on public.kids_creations to authenticated;
grant delete on public.kids_creations to authenticated;

grant select, insert (creation_id, reaction_type), delete
  on public.kids_creation_reactions to authenticated;

grant all on public.kids_creations to service_role;
grant all on public.kids_creation_reactions to service_role;

create policy "Members can read approved Pony Pages creations"
on public.kids_creations
for select
to authenticated
using (
  (
    moderation_status = 'published'
    and (select private.has_active_membership((select auth.uid())))
  )
  or parent_profile_id = (select auth.uid())
  or (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
);

create policy "Members can submit Pony Pages creations"
on public.kids_creations
for insert
to authenticated
with check (
  parent_profile_id = (select auth.uid())
  and guardian_attested = true
  and moderation_status = 'pending'
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Parents can edit pending Pony Pages creations"
on public.kids_creations
for update
to authenticated
using (
  parent_profile_id = (select auth.uid())
  and moderation_status = 'pending'
)
with check (
  parent_profile_id = (select auth.uid())
  and moderation_status = 'pending'
  and guardian_attested = true
);

create policy "Parents can delete pending Pony Pages creations"
on public.kids_creations
for delete
to authenticated
using (
  parent_profile_id = (select auth.uid())
  and moderation_status = 'pending'
);

create policy "Community staff can moderate Pony Pages creations"
on public.kids_creations
for update
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
)
with check (
  (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
);

create policy "Members can read Pony Pages reactions"
on public.kids_creation_reactions
for select
to authenticated
using (
  (select private.has_active_membership((select auth.uid())))
  and exists (
    select 1
    from public.kids_creations as creation
    where creation.id = kids_creation_reactions.creation_id
      and creation.moderation_status = 'published'
  )
);

create policy "Members can add Pony Pages reactions"
on public.kids_creation_reactions
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
  and exists (
    select 1
    from public.kids_creations as creation
    where creation.id = kids_creation_reactions.creation_id
      and creation.moderation_status = 'published'
  )
);

create policy "Members can remove their Pony Pages reactions"
on public.kids_creation_reactions
for delete
to authenticated
using (profile_id = (select auth.uid()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'kids-creations',
  'kids-creations',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can read approved Pony Pages images" on storage.objects;
drop policy if exists "Parents can read their Pony Pages images" on storage.objects;
drop policy if exists "Community staff can read Pony Pages images" on storage.objects;
drop policy if exists "Parents can upload Pony Pages images" on storage.objects;
drop policy if exists "Parents can delete Pony Pages images" on storage.objects;

create policy "Members can read approved Pony Pages images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kids-creations'
  and (select private.has_active_membership((select auth.uid())))
  and exists (
    select 1
    from public.kids_creations as creation
    where creation.image_path = name
      and creation.moderation_status = 'published'
  )
);

create policy "Parents can read their Pony Pages images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kids-creations'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Community staff can read Pony Pages images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kids-creations'
  and (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
);

create policy "Parents can upload Pony Pages images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'kids-creations'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Parents can delete Pony Pages images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'kids-creations'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

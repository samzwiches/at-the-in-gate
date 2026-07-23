-- Cross-link existing public records without replacing their useful free-text fields.

create table public.listing_directory_relationships (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  directory_entry_id uuid not null references public.directory_entries(id) on delete restrict,
  relationship_type text not null,
  created_at timestamptz not null default now(),

  constraint listing_directory_relationships_type_check check (
    relationship_type in ('seller', 'trainer', 'barn', 'shipper', 'service_provider')
  ),
  constraint listing_directory_relationships_unique unique (
    listing_id,
    directory_entry_id,
    relationship_type
  )
);

create unique index listing_directory_relationships_one_named_role_idx
  on public.listing_directory_relationships (listing_id, relationship_type)
  where relationship_type in ('seller', 'trainer', 'barn', 'shipper');

create index listing_directory_relationships_directory_entry_idx
  on public.listing_directory_relationships (directory_entry_id, relationship_type, created_at desc);

create table public.listing_event_relationships (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint listing_event_relationships_unique unique (listing_id, event_id)
);

create index listing_event_relationships_event_idx
  on public.listing_event_relationships (event_id, created_at desc);

alter table public.jobs
  add column directory_entry_id uuid references public.directory_entries(id) on delete set null;

create index jobs_directory_entry_idx
  on public.jobs (directory_entry_id)
  where directory_entry_id is not null;

alter table public.events
  add column organizer_directory_entry_id uuid references public.directory_entries(id) on delete set null;

create index events_organizer_directory_entry_idx
  on public.events (organizer_directory_entry_id)
  where organizer_directory_entry_id is not null;

create or replace function private.validate_listing_directory_relationship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_category text;
begin
  select category
  into entry_category
  from public.directory_entries
  where id = new.directory_entry_id;

  if entry_category is null then
    raise exception 'The selected directory entry does not exist.';
  end if;

  if (new.relationship_type = 'trainer' and entry_category <> 'trainers')
    or (new.relationship_type = 'barn' and entry_category <> 'barns')
    or (new.relationship_type = 'shipper' and entry_category <> 'shippers') then
    raise exception 'The selected directory entry does not match the requested relationship type.';
  end if;

  return new;
end;
$$;

create or replace function private.validate_job_directory_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.directory_entry_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.directory_entries as entry
    where entry.id = new.directory_entry_id
      and entry.moderation_status = 'published'
      and (
        entry.owner_id = new.owner_id
        or private.has_community_role(auth.uid(), array['admin']::text[])
      )
  ) then
    raise exception 'A job may link only to a published directory entry owned by the posting account.';
  end if;

  return new;
end;
$$;

create or replace function private.validate_event_organizer_directory_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organizer_directory_entry_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.directory_entries as entry
    where entry.id = new.organizer_directory_entry_id
      and entry.moderation_status = 'published'
      and (
        entry.owner_id = new.owner_id
        or private.has_community_role(auth.uid(), array['admin']::text[])
      )
  ) then
    raise exception 'An event may link only to a published directory entry owned by the organizer account.';
  end if;

  return new;
end;
$$;

create trigger validate_listing_directory_relationship
before insert or update of directory_entry_id, relationship_type
on public.listing_directory_relationships
for each row
execute function private.validate_listing_directory_relationship();

create trigger validate_job_directory_entry
before insert or update of directory_entry_id, owner_id
on public.jobs
for each row
execute function private.validate_job_directory_entry();

create trigger validate_event_organizer_directory_entry
before insert or update of organizer_directory_entry_id, owner_id
on public.events
for each row
execute function private.validate_event_organizer_directory_entry();

revoke all on function private.validate_listing_directory_relationship() from public;
revoke all on function private.validate_job_directory_entry() from public;
revoke all on function private.validate_event_organizer_directory_entry() from public;

alter table public.listing_directory_relationships enable row level security;
alter table public.listing_event_relationships enable row level security;

grant select on public.listing_directory_relationships to anon, authenticated;
grant insert, update, delete on public.listing_directory_relationships to authenticated;
grant all on public.listing_directory_relationships to service_role;

grant select on public.listing_event_relationships to anon, authenticated;
grant insert, update, delete on public.listing_event_relationships to authenticated;
grant all on public.listing_event_relationships to service_role;

create policy "Public listing directory relationships are readable"
on public.listing_directory_relationships
for select
to anon
using (
  exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.status = 'published'
  )
  and exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id and entry.moderation_status = 'published'
  )
);

create policy "Authenticated listing directory relationship access is scoped"
on public.listing_directory_relationships
for select
to authenticated
using (
  (
    exists (
      select 1 from public.listings as listing
      where listing.id = listing_id and listing.status = 'published'
    )
    and exists (
      select 1 from public.directory_entries as entry
      where entry.id = directory_entry_id and entry.moderation_status = 'published'
    )
  )
  or exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Listing owners and administrators can create directory relationships"
on public.listing_directory_relationships
for insert
to authenticated
with check (
  (
    exists (
      select 1 from public.listings as listing
      where listing.id = listing_id and listing.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.directory_entries as entry
      where entry.id = directory_entry_id and entry.moderation_status = 'published'
    )
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Listing owners and administrators can update directory relationships"
on public.listing_directory_relationships
for update
to authenticated
using (
  exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (
    exists (
      select 1 from public.listings as listing
      where listing.id = listing_id and listing.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.directory_entries as entry
      where entry.id = directory_entry_id and entry.moderation_status = 'published'
    )
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Listing owners and administrators can remove directory relationships"
on public.listing_directory_relationships
for delete
to authenticated
using (
  exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Public listing event relationships are readable"
on public.listing_event_relationships
for select
to anon
using (
  exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.status = 'published'
  )
  and exists (
    select 1 from public.events as event
    where event.id = event_id and event.moderation_status = 'published'
  )
);

create policy "Authenticated listing event relationship access is scoped"
on public.listing_event_relationships
for select
to authenticated
using (
  (
    exists (
      select 1 from public.listings as listing
      where listing.id = listing_id and listing.status = 'published'
    )
    and exists (
      select 1 from public.events as event
      where event.id = event_id and event.moderation_status = 'published'
    )
  )
  or exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Listing owners and administrators can create event relationships"
on public.listing_event_relationships
for insert
to authenticated
with check (
  (
    exists (
      select 1 from public.listings as listing
      where listing.id = listing_id and listing.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.events as event
      where event.id = event_id and event.moderation_status = 'published'
    )
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Listing owners and administrators can update event relationships"
on public.listing_event_relationships
for update
to authenticated
using (
  exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (
    exists (
      select 1 from public.listings as listing
      where listing.id = listing_id and listing.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.events as event
      where event.id = event_id and event.moderation_status = 'published'
    )
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Listing owners and administrators can remove event relationships"
on public.listing_event_relationships
for delete
to authenticated
using (
  exists (
    select 1 from public.listings as listing
    where listing.id = listing_id and listing.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

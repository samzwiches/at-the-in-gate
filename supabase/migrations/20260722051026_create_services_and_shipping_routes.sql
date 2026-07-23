-- Directory entries remain the public identity. These records describe a specific
-- offering or route without duplicating the person, business, barn, or shipper.

create table public.service_offerings (
  id uuid primary key default gen_random_uuid(),
  directory_entry_id uuid not null references public.directory_entries(id) on delete cascade,
  slug text not null unique,
  title text not null,
  category text not null,
  description text not null,
  service_area text,
  website text,
  image_path text,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint service_offerings_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint service_offerings_title_length_check check (char_length(trim(title)) between 1 and 180),
  constraint service_offerings_category_check check (
    category in (
      'training-and-riding',
      'boarding-and-barn',
      'shipping-and-transportation',
      'photography-and-media',
      'veterinary-and-wellness',
      'show-services',
      'insurance-and-finance',
      'other'
    )
  ),
  constraint service_offerings_description_length_check check (char_length(trim(description)) between 1 and 10000),
  constraint service_offerings_service_area_length_check check (service_area is null or char_length(service_area) <= 240),
  constraint service_offerings_website_check check (website is null or (char_length(website) <= 2000 and website ~ '^https?://')),
  constraint service_offerings_image_path_length_check check (image_path is null or char_length(image_path) <= 500),
  constraint service_offerings_moderation_status_check check (
    moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

create table public.shipping_routes (
  id uuid primary key default gen_random_uuid(),
  directory_entry_id uuid not null references public.directory_entries(id) on delete cascade,
  slug text not null unique,
  title text not null,
  origin text not null,
  destination text not null,
  availability_note text,
  description text not null,
  image_path text,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shipping_routes_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint shipping_routes_title_length_check check (char_length(trim(title)) between 1 and 180),
  constraint shipping_routes_origin_length_check check (char_length(trim(origin)) between 1 and 180),
  constraint shipping_routes_destination_length_check check (char_length(trim(destination)) between 1 and 180),
  constraint shipping_routes_availability_length_check check (availability_note is null or char_length(availability_note) <= 500),
  constraint shipping_routes_description_length_check check (char_length(trim(description)) between 1 and 10000),
  constraint shipping_routes_image_path_length_check check (image_path is null or char_length(image_path) <= 500),
  constraint shipping_routes_moderation_status_check check (
    moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

create index service_offerings_public_feed_idx
  on public.service_offerings (category, created_at desc)
  where moderation_status = 'published';

create index service_offerings_directory_status_idx
  on public.service_offerings (directory_entry_id, moderation_status, updated_at desc);

create index service_offerings_moderation_queue_idx
  on public.service_offerings (updated_at asc)
  where moderation_status in ('pending', 'rejected', 'archived');

create index shipping_routes_public_feed_idx
  on public.shipping_routes (created_at desc)
  where moderation_status = 'published';

create index shipping_routes_directory_status_idx
  on public.shipping_routes (directory_entry_id, moderation_status, updated_at desc);

create index shipping_routes_moderation_queue_idx
  on public.shipping_routes (updated_at asc)
  where moderation_status in ('pending', 'rejected', 'archived');

create or replace function private.validate_shipping_route_directory_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.directory_entries as entry
    where entry.id = new.directory_entry_id
      and entry.category = 'shippers'
  ) then
    raise exception 'Shipping routes must belong to a directory entry in the shippers category.';
  end if;

  return new;
end;
$$;

create trigger set_service_offerings_updated_at
before update on public.service_offerings
for each row
execute function public.set_updated_at();

create trigger set_shipping_routes_updated_at
before update on public.shipping_routes
for each row
execute function public.set_updated_at();

create trigger validate_shipping_route_directory_entry
before insert or update of directory_entry_id on public.shipping_routes
for each row
execute function private.validate_shipping_route_directory_entry();

revoke all on function private.validate_shipping_route_directory_entry() from public;

alter table public.service_offerings enable row level security;
alter table public.shipping_routes enable row level security;

grant select on public.service_offerings to anon, authenticated;
grant insert, update on public.service_offerings to authenticated;
revoke delete on public.service_offerings from anon, authenticated;
grant all on public.service_offerings to service_role;

grant select on public.shipping_routes to anon, authenticated;
grant insert, update on public.shipping_routes to authenticated;
revoke delete on public.shipping_routes from anon, authenticated;
grant all on public.shipping_routes to service_role;

create policy "Published service offerings are publicly readable"
on public.service_offerings
for select
to anon
using (
  moderation_status = 'published'
  and exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id and entry.moderation_status = 'published'
  )
);

create policy "Authenticated service offering access is scoped"
on public.service_offerings
for select
to authenticated
using (
  (
    moderation_status = 'published'
    and exists (
      select 1 from public.directory_entries as entry
      where entry.id = directory_entry_id and entry.moderation_status = 'published'
    )
  )
  or exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id and entry.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Directory owners can create their service offerings"
on public.service_offerings
for insert
to authenticated
with check (
  exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id and entry.owner_id = (select auth.uid())
  )
);

create policy "Directory owners and administrators can update service offerings"
on public.service_offerings
for update
to authenticated
using (
  exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id and entry.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (
    exists (
      select 1 from public.directory_entries as entry
      where entry.id = directory_entry_id
        and entry.owner_id = (select auth.uid())
    )
    and moderation_status in ('draft', 'pending', 'archived')
  )
  or (
    (select private.has_community_role((select auth.uid()), array['admin']::text[]))
    and moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

create policy "Published shipping routes are publicly readable"
on public.shipping_routes
for select
to anon
using (
  moderation_status = 'published'
  and exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id
      and entry.category = 'shippers'
      and entry.moderation_status = 'published'
  )
);

create policy "Authenticated shipping route access is scoped"
on public.shipping_routes
for select
to authenticated
using (
  (
    moderation_status = 'published'
    and exists (
      select 1 from public.directory_entries as entry
      where entry.id = directory_entry_id
        and entry.category = 'shippers'
        and entry.moderation_status = 'published'
    )
  )
  or exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id and entry.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Shipper directory owners can create routes"
on public.shipping_routes
for insert
to authenticated
with check (
  exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id
      and entry.category = 'shippers'
      and entry.owner_id = (select auth.uid())
  )
);

create policy "Shipper directory owners and administrators can update routes"
on public.shipping_routes
for update
to authenticated
using (
  exists (
    select 1 from public.directory_entries as entry
    where entry.id = directory_entry_id and entry.owner_id = (select auth.uid())
  )
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (
    exists (
      select 1 from public.directory_entries as entry
      where entry.id = directory_entry_id
        and entry.category = 'shippers'
        and entry.owner_id = (select auth.uid())
    )
    and moderation_status in ('draft', 'pending', 'archived')
  )
  or (
    (select private.has_community_role((select auth.uid()), array['admin']::text[]))
    and moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

-- Reviews are a moderated, target-specific reputation layer. A review has one
-- target, never a polymorphic text reference, so every target remains an FK.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  directory_entry_id uuid references public.directory_entries(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  service_offering_id uuid references public.service_offerings(id) on delete cascade,
  shipping_route_id uuid references public.shipping_routes(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  rating smallint not null,
  title text,
  body text not null,
  moderation_status text not null default 'pending',
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reviews_target_check check (
    num_nonnulls(directory_entry_id, listing_id, service_offering_id, shipping_route_id, event_id) = 1
  ),
  constraint reviews_rating_check check (rating between 1 and 5),
  constraint reviews_title_length_check check (title is null or char_length(trim(title)) between 1 and 180),
  constraint reviews_body_length_check check (char_length(trim(body)) between 1 and 5000),
  constraint reviews_moderation_status_check check (
    moderation_status in ('draft', 'pending', 'published', 'hidden', 'rejected', 'archived')
  ),
  constraint reviews_deleted_by_check check (
    (deleted_at is null and deleted_by_profile_id is null)
    or (deleted_at is not null and deleted_by_profile_id is not null)
  )
);

create unique index reviews_one_active_directory_entry_review_idx
  on public.reviews (author_id, directory_entry_id)
  where directory_entry_id is not null and deleted_at is null;

create unique index reviews_one_active_listing_review_idx
  on public.reviews (author_id, listing_id)
  where listing_id is not null and deleted_at is null;

create unique index reviews_one_active_service_offering_review_idx
  on public.reviews (author_id, service_offering_id)
  where service_offering_id is not null and deleted_at is null;

create unique index reviews_one_active_shipping_route_review_idx
  on public.reviews (author_id, shipping_route_id)
  where shipping_route_id is not null and deleted_at is null;

create unique index reviews_one_active_event_review_idx
  on public.reviews (author_id, event_id)
  where event_id is not null and deleted_at is null;

create index reviews_public_feed_idx
  on public.reviews (created_at desc)
  where moderation_status = 'published' and deleted_at is null;

create index reviews_directory_entry_idx
  on public.reviews (directory_entry_id, created_at desc)
  where directory_entry_id is not null;

create index reviews_listing_idx
  on public.reviews (listing_id, created_at desc)
  where listing_id is not null;

create index reviews_service_offering_idx
  on public.reviews (service_offering_id, created_at desc)
  where service_offering_id is not null;

create index reviews_shipping_route_idx
  on public.reviews (shipping_route_id, created_at desc)
  where shipping_route_id is not null;

create index reviews_event_idx
  on public.reviews (event_id, created_at desc)
  where event_id is not null;

create index reviews_moderation_queue_idx
  on public.reviews (updated_at asc)
  where moderation_status in ('pending', 'hidden', 'rejected', 'archived') and deleted_at is null;

create or replace function private.review_target_is_public(
  p_directory_entry_id uuid,
  p_listing_id uuid,
  p_service_offering_id uuid,
  p_shipping_route_id uuid,
  p_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.directory_entries as entry
      where entry.id = p_directory_entry_id and entry.moderation_status = 'published'
    )
    or exists (
      select 1 from public.listings as listing
      where listing.id = p_listing_id and listing.status = 'published'
    )
    or exists (
      select 1
      from public.service_offerings as service
      join public.directory_entries as entry on entry.id = service.directory_entry_id
      where service.id = p_service_offering_id
        and service.moderation_status = 'published'
        and entry.moderation_status = 'published'
    )
    or exists (
      select 1
      from public.shipping_routes as route
      join public.directory_entries as entry on entry.id = route.directory_entry_id
      where route.id = p_shipping_route_id
        and route.moderation_status = 'published'
        and entry.moderation_status = 'published'
    )
    or exists (
      select 1 from public.events as event
      where event.id = p_event_id and event.moderation_status = 'published'
    );
$$;

create or replace function private.review_target_is_owned_by(
  p_profile_id uuid,
  p_directory_entry_id uuid,
  p_listing_id uuid,
  p_service_offering_id uuid,
  p_shipping_route_id uuid,
  p_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.directory_entries as entry
      where entry.id = p_directory_entry_id and entry.owner_id = p_profile_id
    )
    or exists (
      select 1 from public.listings as listing
      where listing.id = p_listing_id and listing.owner_id = p_profile_id
    )
    or exists (
      select 1
      from public.service_offerings as service
      join public.directory_entries as entry on entry.id = service.directory_entry_id
      where service.id = p_service_offering_id and entry.owner_id = p_profile_id
    )
    or exists (
      select 1
      from public.shipping_routes as route
      join public.directory_entries as entry on entry.id = route.directory_entry_id
      where route.id = p_shipping_route_id and entry.owner_id = p_profile_id
    )
    or exists (
      select 1 from public.events as event
      where event.id = p_event_id and event.owner_id = p_profile_id
    );
$$;

create or replace function private.set_review_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.author_id is distinct from old.author_id
      or new.directory_entry_id is distinct from old.directory_entry_id
      or new.listing_id is distinct from old.listing_id
      or new.service_offering_id is distinct from old.service_offering_id
      or new.shipping_route_id is distinct from old.shipping_route_id
      or new.event_id is distinct from old.event_id then
      raise exception 'A review author and target cannot be changed.';
    end if;

    if old.deleted_at is not null and new.deleted_at is null then
      raise exception 'A soft-deleted review cannot be restored.';
    end if;

    if new.deleted_at is not null and old.deleted_at is null then
      new.deleted_at = now();
      new.deleted_by_profile_id = auth.uid();
      new.moderation_status = 'archived';
    elsif new.rating is distinct from old.rating
      or new.title is distinct from old.title
      or new.body is distinct from old.body then
      new.edited_at = now();
    end if;
  end if;

  if private.review_target_is_owned_by(
    new.author_id,
    new.directory_entry_id,
    new.listing_id,
    new.service_offering_id,
    new.shipping_route_id,
    new.event_id
  ) then
    raise exception 'You cannot review a record you own.';
  end if;

  return new;
end;
$$;

create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();

create trigger set_review_audit
before insert or update on public.reviews
for each row
execute function private.set_review_audit();

revoke all on function private.review_target_is_public(uuid, uuid, uuid, uuid, uuid) from public;
revoke all on function private.review_target_is_owned_by(uuid, uuid, uuid, uuid, uuid, uuid) from public;
revoke all on function private.set_review_audit() from public;
grant execute on function private.review_target_is_public(uuid, uuid, uuid, uuid, uuid) to anon, authenticated;

alter table public.reviews enable row level security;

grant select on public.reviews to anon, authenticated;
grant insert, update on public.reviews to authenticated;
revoke delete on public.reviews from anon, authenticated;
grant all on public.reviews to service_role;

create policy "Published reviews are publicly readable"
on public.reviews
for select
to anon
using (
  moderation_status = 'published'
  and deleted_at is null
  and private.review_target_is_public(
    directory_entry_id,
    listing_id,
    service_offering_id,
    shipping_route_id,
    event_id
  )
);

create policy "Authenticated review access is scoped"
on public.reviews
for select
to authenticated
using (
  (
    moderation_status = 'published'
    and deleted_at is null
    and private.review_target_is_public(
      directory_entry_id,
      listing_id,
      service_offering_id,
      shipping_route_id,
      event_id
    )
  )
  or author_id = (select auth.uid())
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Authenticated users can write reviews for public targets"
on public.reviews
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and moderation_status in ('draft', 'pending')
  and private.review_target_is_public(
    directory_entry_id,
    listing_id,
    service_offering_id,
    shipping_route_id,
    event_id
  )
);

create policy "Review authors can edit or soft-delete their own reviews"
on public.reviews
for update
to authenticated
using (
  author_id = (select auth.uid())
  and deleted_at is null
)
with check (
  author_id = (select auth.uid())
  and (
    deleted_at is not null
    or moderation_status in ('draft', 'pending')
  )
);

create policy "Review administrators can moderate reviews"
on public.reviews
for update
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
  and moderation_status in ('draft', 'pending', 'published', 'hidden', 'rejected', 'archived')
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),

  constraint listing_images_sort_order_check check (sort_order >= 0),
  constraint listing_images_alt_text_length_check check (alt_text is null or char_length(alt_text) <= 500)
);

create index listing_images_listing_sort_idx
  on public.listing_images (listing_id, sort_order, created_at);

create index listing_images_owner_idx
  on public.listing_images (owner_id, created_at desc);

create unique index listing_images_one_primary_per_listing_idx
  on public.listing_images (listing_id)
  where is_primary;

create or replace function public.assign_listing_image_primary()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    new.listing_id is distinct from old.listing_id
    or new.owner_id is distinct from old.owner_id
  ) then
    raise exception 'Listing images cannot be moved between listings or owners';
  end if;

  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.is_primary then
    update public.listing_images
    set is_primary = false
    where listing_id = new.listing_id
      and id is distinct from new.id
      and is_primary;
  elsif not exists (
    select 1
    from public.listing_images image
    where image.listing_id = new.listing_id
      and image.id is distinct from new.id
  ) then
    new.is_primary := true;
  end if;

  return new;
end;
$$;

create function public.promote_listing_image_primary_after_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_primary then
    update public.listing_images
    set is_primary = true
    where id = (
      select image.id
      from public.listing_images image
      where image.listing_id = old.listing_id
      order by image.sort_order asc, image.created_at asc
      limit 1
    );
  end if;

  return old;
end;
$$;

create trigger assign_listing_image_primary
before insert or update of is_primary, listing_id, owner_id on public.listing_images
for each row
execute function public.assign_listing_image_primary();

create trigger promote_listing_image_primary_after_delete
after delete on public.listing_images
for each row
execute function public.promote_listing_image_primary_after_delete();

revoke all on function public.assign_listing_image_primary() from public;
revoke all on function public.promote_listing_image_primary_after_delete() from public;

alter table public.listing_images enable row level security;

grant select on public.listing_images to anon, authenticated;
grant insert, update, delete on public.listing_images to authenticated;

create policy "Published listing images are publicly readable"
on public.listing_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_images.listing_id
      and listing.status = 'published'
  )
);

create policy "Listing image owners can read their own images"
on public.listing_images
for select
to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_images.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing owners can add their own images"
on public.listing_images
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_images.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing owners can update their own images"
on public.listing_images
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_images.listing_id
      and listing.owner_id = (select auth.uid())
  )
)
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_images.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing owners can delete their own images"
on public.listing_images
for delete
to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_images.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Published listing image objects are readable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'listing-images'
  and exists (
    select 1
    from public.listing_images image
    join public.listings listing on listing.id = image.listing_id
    where image.storage_path = name
      and listing.status = 'published'
  )
);

create policy "Listing image owners can read their objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'listing-images'
  and owner_id = (select auth.uid()::text)
  and exists (
    select 1
    from public.listing_images image
    join public.listings listing on listing.id = image.listing_id
    where image.storage_path = name
      and image.owner_id = (select auth.uid())
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing owners can upload image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and owner_id = (select auth.uid()::text)
  and exists (
    select 1
    from public.listings listing
    where listing.id::text = (storage.foldername(name))[1]
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing image owners can delete their objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and owner_id = (select auth.uid()::text)
  and exists (
    select 1
    from public.listing_images image
    join public.listings listing on listing.id = image.listing_id
    where image.storage_path = name
      and image.owner_id = (select auth.uid())
      and listing.owner_id = (select auth.uid())
  )
);

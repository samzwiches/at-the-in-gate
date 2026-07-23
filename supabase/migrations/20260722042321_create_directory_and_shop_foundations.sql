create table public.directory_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  slug text not null unique,
  name text not null,
  entry_type text not null default 'service',
  category text not null,
  description text not null,
  city text not null,
  state text not null,
  service_area text,
  website text,
  email text,
  phone text,
  image_path text,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint directory_entries_slug_format_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint directory_entries_name_length_check check (
    char_length(trim(name)) between 1 and 180
  ),
  constraint directory_entries_type_check check (
    entry_type in ('individual', 'business', 'service')
  ),
  constraint directory_entries_category_check check (
    category in ('trainers', 'barns', 'shippers', 'photographers', 'veterinarians')
  ),
  constraint directory_entries_description_length_check check (
    char_length(trim(description)) between 1 and 10000
  ),
  constraint directory_entries_city_length_check check (
    char_length(trim(city)) between 1 and 100
  ),
  constraint directory_entries_state_length_check check (
    char_length(trim(state)) between 2 and 80
  ),
  constraint directory_entries_service_area_length_check check (
    service_area is null or char_length(service_area) <= 240
  ),
  constraint directory_entries_website_check check (
    website is null or (char_length(website) <= 2000 and website ~ '^https?://')
  ),
  constraint directory_entries_email_check check (
    email is null or (char_length(email) <= 320 and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')
  ),
  constraint directory_entries_phone_length_check check (
    phone is null or char_length(phone) <= 50
  ),
  constraint directory_entries_image_path_length_check check (
    image_path is null or char_length(image_path) <= 500
  ),
  constraint directory_entries_moderation_status_check check (
    moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text not null,
  category text not null,
  image_path text,
  destination_url text not null,
  price_label text,
  seller_name text not null,
  is_affiliate boolean not null default false,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shop_items_slug_format_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint shop_items_title_length_check check (
    char_length(trim(title)) between 1 and 180
  ),
  constraint shop_items_description_length_check check (
    char_length(trim(description)) between 1 and 10000
  ),
  constraint shop_items_category_check check (
    category in ('resources', 'tack-and-equipment', 'barn-and-show-gear', 'apparel-and-accessories')
  ),
  constraint shop_items_image_path_length_check check (
    image_path is null or char_length(image_path) <= 500
  ),
  constraint shop_items_destination_url_check check (
    char_length(destination_url) <= 2000 and destination_url ~ '^https?://'
  ),
  constraint shop_items_price_label_length_check check (
    price_label is null or char_length(price_label) <= 120
  ),
  constraint shop_items_seller_name_length_check check (
    char_length(trim(seller_name)) between 1 and 180
  ),
  constraint shop_items_moderation_status_check check (
    moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

create index directory_entries_public_category_feed_idx
  on public.directory_entries (category, created_at desc)
  where moderation_status = 'published';

create index directory_entries_owner_status_updated_idx
  on public.directory_entries (owner_id, moderation_status, updated_at desc);

create index directory_entries_moderation_queue_idx
  on public.directory_entries (created_at asc)
  where moderation_status in ('pending', 'rejected', 'archived');

create index shop_items_public_category_feed_idx
  on public.shop_items (category, created_at desc)
  where moderation_status = 'published';

create index shop_items_owner_status_updated_idx
  on public.shop_items (owner_id, moderation_status, updated_at desc);

create index shop_items_moderation_queue_idx
  on public.shop_items (created_at asc)
  where moderation_status in ('pending', 'rejected', 'archived');

create trigger set_directory_entries_updated_at
before update on public.directory_entries
for each row
execute function public.set_updated_at();

create trigger set_shop_items_updated_at
before update on public.shop_items
for each row
execute function public.set_updated_at();

alter table public.directory_entries enable row level security;
alter table public.shop_items enable row level security;

grant select on public.directory_entries to anon, authenticated;
grant insert, update on public.directory_entries to authenticated;
revoke delete on public.directory_entries from anon, authenticated;

grant select on public.shop_items to anon, authenticated;
grant insert, update on public.shop_items to authenticated;
revoke delete on public.shop_items from anon, authenticated;

grant all on public.directory_entries to service_role;
grant all on public.shop_items to service_role;

create policy "Approved directory entries are publicly readable"
on public.directory_entries
for select
to anon, authenticated
using (moderation_status = 'published');

create policy "Directory owners can read their own entries"
on public.directory_entries
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Directory administrators can review entries"
on public.directory_entries
for select
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Authenticated users can create their own directory entries"
on public.directory_entries
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending')
);

create policy "Directory owners can manage non-public states"
on public.directory_entries
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending', 'archived')
);

create policy "Directory administrators can moderate entries"
on public.directory_entries
for update
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
  and moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
);

create policy "Approved shop items are publicly readable"
on public.shop_items
for select
to anon, authenticated
using (moderation_status = 'published');

create policy "Shop owners can read their own items"
on public.shop_items
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Shop administrators can review items"
on public.shop_items
for select
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Authenticated users can create their own shop items"
on public.shop_items
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending')
);

create policy "Shop owners can manage non-public states"
on public.shop_items
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending', 'archived')
);

create policy "Shop administrators can moderate items"
on public.shop_items
for update
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
  and moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  horse_name text not null,
  listing_type text not null
    check (listing_type in ('for_sale', 'lease', 'sale_or_lease')),
  division text not null,
  age smallint check (age is null or age between 0 and 40),
  height_text text,
  breed text,
  sex text,
  location text not null,
  price_text text not null,
  description text,
  image_path text,
  image_alt_text text,
  image_focal_position text not null default '50% 50%',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint listings_image_alt_when_image_exists check (
    image_path is null
    or length(trim(coalesce(image_alt_text, ''))) > 0
  )
);

create index listings_public_feed_idx
  on public.listings (is_featured desc, created_at desc)
  where is_published;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

alter table public.listings enable row level security;

grant select on public.listings to anon, authenticated;
revoke insert, update, delete on public.listings from anon, authenticated;

create policy "Published listings are publicly readable"
  on public.listings
  for select
  to anon, authenticated
  using (is_published = true);

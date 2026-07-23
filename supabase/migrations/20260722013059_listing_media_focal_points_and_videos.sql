alter table public.listing_images
  add column focal_x numeric not null default 50,
  add column focal_y numeric not null default 50,
  add constraint listing_images_focal_x_check check (focal_x >= 0 and focal_x <= 100),
  add constraint listing_images_focal_y_check check (focal_y >= 0 and focal_y <= 100);

create table public.listing_videos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  video_url text not null,
  provider_video_id text,
  title text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint listing_videos_provider_check check (provider in ('youtube', 'vimeo', 'upload')),
  constraint listing_videos_url_check check (video_url ~ '^https?://'),
  constraint listing_videos_provider_video_id_length_check check (provider_video_id is null or char_length(provider_video_id) between 1 and 100),
  constraint listing_videos_title_length_check check (title is null or char_length(title) <= 200),
  constraint listing_videos_sort_order_check check (sort_order >= 0)
);

create index listing_videos_listing_sort_idx
  on public.listing_videos (listing_id, sort_order, created_at);

create index listing_videos_owner_idx
  on public.listing_videos (owner_id, created_at desc);

alter table public.listing_videos enable row level security;

grant select on public.listing_videos to anon, authenticated;
grant insert, update, delete on public.listing_videos to authenticated;

create policy "Published listing videos are publicly readable"
on public.listing_videos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_videos.listing_id
      and listing.status = 'published'
  )
);

create policy "Listing video owners can read their own videos"
on public.listing_videos
for select
to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_videos.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing owners can add their own videos"
on public.listing_videos
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_videos.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing owners can update their own videos"
on public.listing_videos
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_videos.listing_id
      and listing.owner_id = (select auth.uid())
  )
)
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_videos.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

create policy "Listing owners can delete their own videos"
on public.listing_videos
for delete
to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_videos.listing_id
      and listing.owner_id = (select auth.uid())
  )
);

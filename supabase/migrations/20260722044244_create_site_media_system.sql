create table public.site_media (
  id uuid primary key default gen_random_uuid(),
  media_key text not null unique,
  page_key text not null,
  placement text not null,
  storage_path text not null unique,
  alt_text text,
  caption text,
  focal_x numeric not null default 50,
  focal_y numeric not null default 50,
  overlay_opacity numeric not null default 0,
  overlay_tone text not null default 'none',
  mobile_storage_path text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  constraint site_media_key_format_check check (
    media_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'
  ),
  constraint site_media_page_key_format_check check (
    page_key ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$'
  ),
  constraint site_media_placement_check check (
    placement in ('hero', 'section-background', 'footer-background', 'contained-editorial', 'card-image', 'texture')
  ),
  constraint site_media_storage_path_check check (
    char_length(storage_path) between 1 and 500
    and storage_path !~ '(^|/)\\.\\.?(/|$)'
  ),
  constraint site_media_mobile_storage_path_check check (
    mobile_storage_path is null
    or (
      char_length(mobile_storage_path) between 1 and 500
      and mobile_storage_path !~ '(^|/)\\.\\.?(/|$)'
    )
  ),
  constraint site_media_alt_text_length_check check (
    alt_text is null or char_length(alt_text) <= 500
  ),
  constraint site_media_caption_length_check check (
    caption is null or char_length(caption) <= 500
  ),
  constraint site_media_focal_x_check check (focal_x between 0 and 100),
  constraint site_media_focal_y_check check (focal_y between 0 and 100),
  constraint site_media_overlay_opacity_check check (overlay_opacity between 0 and 1),
  constraint site_media_overlay_tone_check check (
    overlay_tone in ('none', 'light', 'dark', 'cream', 'brand')
  ),
  constraint site_media_public_assignment_check check (
    (media_key = 'home.hero' and page_key = 'home' and placement = 'hero')
    or (media_key = 'home.community_background' and page_key = 'home' and placement = 'section-background')
    or (media_key = 'marketplace.hero' and page_key = 'marketplace' and placement = 'hero')
    or (media_key = 'community.hero' and page_key = 'community' and placement = 'hero')
    or (media_key = 'events.hero' and page_key = 'events' and placement = 'hero')
    or (media_key = 'directory.hero' and page_key = 'directory' and placement = 'hero')
    or (media_key = 'jobs.hero' and page_key = 'jobs' and placement = 'hero')
    or (media_key = 'membership.hero' and page_key = 'membership' and placement = 'hero')
    or (media_key = 'shop.hero' and page_key = 'shop' and placement = 'hero')
    or (media_key = 'about.hero' and page_key = 'about' and placement = 'hero')
    or (media_key = 'contact.hero' and page_key = 'contact' and placement = 'hero')
    or (media_key = 'footer.background' and page_key = 'footer' and placement = 'footer-background')
  )
);

create index site_media_page_placement_idx
  on public.site_media (page_key, placement);

create index site_media_updated_by_updated_idx
  on public.site_media (updated_by, updated_at desc);

create trigger set_site_media_updated_at
before update on public.site_media
for each row
execute function public.set_updated_at();

alter table public.site_media enable row level security;

grant select on public.site_media to anon, authenticated;
grant insert, update, delete on public.site_media to authenticated;
grant all on public.site_media to service_role;

create policy "Assigned public site media is readable"
on public.site_media
for select
to anon, authenticated
using (true);

create policy "Site media administrators can create assignments"
on public.site_media
for insert
to authenticated
with check (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Site media administrators can update assignments"
on public.site_media
for update
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Site media administrators can delete assignments"
on public.site_media
for delete
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Assigned site media objects are publicly readable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'site-media'
  and exists (
    select 1
    from public.site_media media
    where media.storage_path = name
      or media.mobile_storage_path = name
  )
);

create policy "Site media administrators can manage objects"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'site-media'
  and (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  bucket_id = 'site-media'
  and (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

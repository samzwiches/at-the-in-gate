create table public.site_section_appearance (
  section_key text primary key,
  font_preset text null,
  default_text_color text null,
  eyebrow_text_color text null,
  heading_text_color text null,
  body_text_color text null,
  button_text_color text null,
  metadata_text_color text null,
  navigation_text_color text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint site_section_appearance_section_key_check check (
    section_key in (
      'header',
      'footer',
      'home.hero',
      'home.community',
      'marketplace.hero',
      'community.hero',
      'events.hero',
      'directory.hero',
      'jobs.hero',
      'membership.hero',
      'shop.hero',
      'about.hero',
      'contact.hero',
      'services.hero',
      'shippers.hero'
    )
  ),
  constraint site_section_appearance_font_preset_check check (
    font_preset is null
    or font_preset in ('inherit', 'serif', 'sans')
  ),
  constraint site_section_appearance_default_text_color_check check (
    default_text_color is null
    or default_text_color ~ '^#[0-9a-f]{6}$'
  ),
  constraint site_section_appearance_eyebrow_text_color_check check (
    eyebrow_text_color is null
    or eyebrow_text_color ~ '^#[0-9a-f]{6}$'
  ),
  constraint site_section_appearance_heading_text_color_check check (
    heading_text_color is null
    or heading_text_color ~ '^#[0-9a-f]{6}$'
  ),
  constraint site_section_appearance_body_text_color_check check (
    body_text_color is null
    or body_text_color ~ '^#[0-9a-f]{6}$'
  ),
  constraint site_section_appearance_button_text_color_check check (
    button_text_color is null
    or button_text_color ~ '^#[0-9a-f]{6}$'
  ),
  constraint site_section_appearance_metadata_text_color_check check (
    metadata_text_color is null
    or metadata_text_color ~ '^#[0-9a-f]{6}$'
  ),
  constraint site_section_appearance_navigation_text_color_check check (
    navigation_text_color is null
    or navigation_text_color ~ '^#[0-9a-f]{6}$'
  )
);

create index site_section_appearance_updated_by_updated_idx
  on public.site_section_appearance (updated_by, updated_at desc);

create trigger set_site_section_appearance_updated_at
before update on public.site_section_appearance
for each row
execute function public.set_updated_at();

alter table public.site_section_appearance enable row level security;

revoke all on table public.site_section_appearance from anon, authenticated;
grant select on table public.site_section_appearance to anon;
grant select, insert, update, delete
on table public.site_section_appearance
to authenticated;
grant all on table public.site_section_appearance to service_role;

create policy "Section appearance is publicly readable"
on public.site_section_appearance
for select
to anon, authenticated
using (true);

create policy "Administrators can insert section appearance"
on public.site_section_appearance
for insert
to authenticated
with check (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Administrators can update section appearance"
on public.site_section_appearance
for update
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Administrators can delete section appearance"
on public.site_section_appearance
for delete
to authenticated
using (
  (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

alter table public.site_media
  drop constraint site_media_public_assignment_check;

alter table public.site_media
  add constraint site_media_public_assignment_check check (
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
    or (media_key = 'services.hero' and page_key = 'services' and placement = 'hero')
    or (media_key = 'shippers.hero' and page_key = 'shippers' and placement = 'hero')
    or (media_key = 'footer.background' and page_key = 'footer' and placement = 'footer-background')
  );

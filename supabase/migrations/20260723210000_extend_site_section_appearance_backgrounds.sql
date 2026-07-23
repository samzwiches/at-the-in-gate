alter table public.site_section_appearance
  add column background_color text null,
  add column surface_color text null,
  add column border_color text null,
  add column hero_edge_style text null,
  add column hero_edge_size integer null;

alter table public.site_section_appearance
  drop constraint site_section_appearance_section_key_check,
  add constraint site_section_appearance_section_key_check check (
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
      'shippers.hero',
      'home.page',
      'marketplace.page',
      'community.page',
      'events.page',
      'directory.page',
      'jobs.page',
      'membership.page',
      'shop.page',
      'about.page',
      'contact.page',
      'services.page',
      'shippers.page'
    )
  ),
  add constraint site_section_appearance_background_color_check check (
    background_color is null
    or background_color ~ '^#[0-9a-f]{6}$'
  ),
  add constraint site_section_appearance_surface_color_check check (
    surface_color is null
    or surface_color ~ '^#[0-9a-f]{6}$'
  ),
  add constraint site_section_appearance_border_color_check check (
    border_color is null
    or border_color ~ '^#[0-9a-f]{6}$'
  ),
  add constraint site_section_appearance_hero_edge_style_check check (
    hero_edge_style is null
    or hero_edge_style in ('inherit', 'soft-fade', 'rounded', 'rounded-fade', 'none')
  ),
  add constraint site_section_appearance_hero_edge_size_check check (
    hero_edge_size is null
    or hero_edge_size between 0 and 96
  );

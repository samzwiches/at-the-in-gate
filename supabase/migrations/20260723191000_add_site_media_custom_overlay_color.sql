alter table public.site_media
  add column overlay_color text;

alter table public.site_media
  add constraint site_media_overlay_color_hex_check
  check (
    overlay_color is null
    or overlay_color ~ '^#[0-9A-Fa-f]{6}$'
  );

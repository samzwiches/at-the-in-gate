alter table public.site_media
  drop constraint if exists site_media_public_assignment_check;

alter table public.site_media
  add constraint site_media_public_assignment_check check (
    (media_key = 'home.hero' and page_key = 'home' and placement = 'hero')
    or (media_key = 'home.community_background' and page_key = 'home' and placement = 'section-background')
    or (media_key = 'marketplace.hero' and page_key = 'marketplace' and placement = 'hero')
    or (media_key = 'community.hero' and page_key = 'community' and placement = 'hero')
    or (media_key = 'events.hero' and page_key = 'events' and placement = 'hero')
    or (media_key = 'directory.hero' and page_key = 'directory' and placement = 'hero')
    or (media_key = 'reviews.hero' and page_key = 'reviews' and placement = 'hero')
    or (media_key = 'jobs.hero' and page_key = 'jobs' and placement = 'hero')
    or (media_key = 'membership.hero' and page_key = 'membership' and placement = 'hero')
    or (media_key = 'shop.hero' and page_key = 'shop' and placement = 'hero')
    or (media_key = 'about.hero' and page_key = 'about' and placement = 'hero')
    or (media_key = 'contact.hero' and page_key = 'contact' and placement = 'hero')
    or (media_key = 'services.hero' and page_key = 'services' and placement = 'hero')
    or (media_key = 'shippers.hero' and page_key = 'shippers' and placement = 'hero')
    or (media_key = 'footer.background' and page_key = 'footer' and placement = 'footer-background')
  );

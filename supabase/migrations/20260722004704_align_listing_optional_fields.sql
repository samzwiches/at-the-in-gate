-- Repair the deployed primary key drift, then keep optional details optional.
alter table public.listings
  drop constraint listings_pkey,
  add constraint listings_pkey primary key (id);

alter table public.listings
  alter column age drop not null,
  alter column breed drop not null,
  alter column description drop not null,
  alter column height_text drop not null,
  alter column image_alt_text drop not null,
  alter column image_path drop not null,
  alter column sex drop not null;

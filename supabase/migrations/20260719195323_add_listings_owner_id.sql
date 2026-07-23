alter table public.listings
add column owner_id uuid references public.profiles(id) on delete cascade;

create index listings_owner_dashboard_idx
on public.listings (owner_id, updated_at desc);

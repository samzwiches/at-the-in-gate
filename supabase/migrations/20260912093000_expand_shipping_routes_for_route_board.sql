alter table public.shipping_routes
  add column departure_date date,
  add column return_date date,
  add column total_capacity integer not null default 1,
  add column booked_spots integer not null default 0,
  add column route_status text not null default 'planning',
  add column is_return_trip boolean not null default false,
  add column stops jsonb not null default '[]'::jsonb;

alter table public.shipping_routes
  add constraint shipping_routes_total_capacity_check
    check (total_capacity between 1 and 30),
  add constraint shipping_routes_booked_spots_check
    check (booked_spots between 0 and total_capacity),
  add constraint shipping_routes_route_status_check
    check (route_status in ('planning', 'open', 'nearly-full', 'full', 'departed', 'completed', 'cancelled')),
  add constraint shipping_routes_return_date_check
    check (return_date is null or departure_date is null or return_date >= departure_date),
  add constraint shipping_routes_stops_array_check
    check (jsonb_typeof(stops) = 'array');

create index shipping_routes_departure_status_idx
  on public.shipping_routes (departure_date asc, route_status)
  where moderation_status = 'published';

comment on column public.shipping_routes.total_capacity is 'Total trailer spaces available for this route before bookings.';
comment on column public.shipping_routes.booked_spots is 'Number of trailer spaces already allocated.';
comment on column public.shipping_routes.stops is 'Ordered public route stops as JSON objects with a location label and optional note.';

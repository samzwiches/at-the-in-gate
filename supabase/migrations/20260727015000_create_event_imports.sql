-- Staging records imported from external show calendars.
-- Nothing in this table is published automatically.

create table public.event_imports (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_url text not null,
  external_id text not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  venue text,
  city text,
  state text,
  zone text,
  affiliations text[] not null default '{}',
  contact_name text,
  contact_phone text,
  raw_data jsonb not null default '{}'::jsonb,
  import_status text not null default 'new',
  matched_event_id uuid references public.events(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint event_imports_source_external_unique unique (source, external_id),
  constraint event_imports_dates_check check (end_date >= start_date),
  constraint event_imports_status_check check (import_status in ('new', 'reviewing', 'approved', 'rejected', 'ignored', 'matched')),
  constraint event_imports_title_length_check check (char_length(trim(title)) between 1 and 240),
  constraint event_imports_source_length_check check (char_length(trim(source)) between 1 and 100),
  constraint event_imports_url_check check (source_url ~ '^https?://')
);

create trigger set_event_imports_updated_at
before update on public.event_imports
for each row
execute function public.set_updated_at();

create index event_imports_status_start_idx
  on public.event_imports (import_status, start_date asc);

create index event_imports_location_start_idx
  on public.event_imports (state, city, start_date asc);

create index event_imports_last_seen_idx
  on public.event_imports (last_seen_at desc);

alter table public.event_imports enable row level security;

-- The importer uses the service-role key. Public and normal authenticated
-- clients intentionally receive no direct table privileges yet.
revoke all on public.event_imports from anon, authenticated;

-- Phase 1 replaces local demonstration data with owned, moderated records.

alter table public.listings
  add column if not exists status text;

update public.listings
set status = case when is_published then 'published' else 'draft' end
where status is null;

alter table public.listings
  alter column status set default 'draft',
  alter column status set not null,
  alter column owner_id set default auth.uid();

alter table public.listings
  add constraint listings_status_check
  check (status in ('draft', 'pending', 'published', 'sold', 'archived'));

create or replace function public.sync_listing_publication_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_published := new.status = 'published';
  return new;
end;
$$;

create trigger sync_listing_publication_status
before insert or update of status on public.listings
for each row
execute function public.sync_listing_publication_status();

revoke all on function public.sync_listing_publication_status() from public;

drop policy if exists "Published listings are publicly readable" on public.listings;

grant select on public.listings to anon, authenticated;
grant insert, update on public.listings to authenticated;
revoke delete on public.listings from anon, authenticated;

create policy "Published listings are publicly readable"
on public.listings
for select
to anon, authenticated
using (status = 'published');

create policy "Listing owners can read their own listings"
on public.listings
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Authenticated users can create their own listings"
on public.listings
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status in ('draft', 'pending')
);

create policy "Listing owners can manage non-public listing states"
on public.listings
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and status in ('draft', 'pending', 'sold', 'archived')
);

create index listings_owner_status_updated_idx
  on public.listings (owner_id, status, updated_at desc)
  where owner_id is not null;

create index listings_public_status_feed_idx
  on public.listings (is_featured desc, created_at desc)
  where status = 'published';

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null,
  slug text not null unique,
  venue text not null,
  city text not null,
  state text not null,
  start_date date not null,
  end_date date not null,
  circuit text not null,
  description text not null,
  website text,
  contact_details text,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint events_title_length_check check (char_length(trim(title)) between 1 and 180),
  constraint events_venue_length_check check (char_length(trim(venue)) between 1 and 180),
  constraint events_city_length_check check (char_length(trim(city)) between 1 and 100),
  constraint events_state_length_check check (char_length(trim(state)) between 2 and 80),
  constraint events_dates_check check (end_date >= start_date),
  constraint events_circuit_length_check check (char_length(trim(circuit)) between 1 and 80),
  constraint events_description_length_check check (char_length(trim(description)) between 1 and 10000),
  constraint events_website_check check (website is null or website ~ '^https?://'),
  constraint events_contact_length_check check (contact_details is null or char_length(contact_details) <= 500),
  constraint events_moderation_status_check check (moderation_status in ('draft', 'pending', 'published', 'hidden', 'removed', 'archived'))
);

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create index events_public_feed_idx
  on public.events (start_date asc, created_at desc)
  where moderation_status = 'published';

create index events_public_circuit_feed_idx
  on public.events (circuit, start_date asc)
  where moderation_status = 'published';

create index events_owner_status_idx
  on public.events (owner_id, moderation_status, updated_at desc);

alter table public.events enable row level security;

grant select on public.events to anon, authenticated;
grant insert, update on public.events to authenticated;
revoke delete on public.events from anon, authenticated;

create policy "Published events are publicly readable"
on public.events
for select
to anon, authenticated
using (moderation_status = 'published');

create policy "Event owners can read their own events"
on public.events
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Authenticated users can create their own events"
on public.events
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending')
);

create policy "Event owners can manage non-public event states"
on public.events
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending', 'archived')
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null,
  slug text not null unique,
  employer text not null,
  category text not null,
  city text not null,
  state text not null,
  employment_type text not null,
  housing_available boolean not null default false,
  show_travel boolean not null default false,
  description text not null,
  application_contact text not null,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint jobs_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint jobs_title_length_check check (char_length(trim(title)) between 1 and 180),
  constraint jobs_employer_length_check check (char_length(trim(employer)) between 1 and 180),
  constraint jobs_category_length_check check (char_length(trim(category)) between 1 and 80),
  constraint jobs_city_length_check check (char_length(trim(city)) between 1 and 100),
  constraint jobs_state_length_check check (char_length(trim(state)) between 2 and 80),
  constraint jobs_employment_type_check check (employment_type in ('full_time', 'part_time', 'seasonal', 'contract')),
  constraint jobs_description_length_check check (char_length(trim(description)) between 1 and 10000),
  constraint jobs_application_contact_length_check check (char_length(trim(application_contact)) between 3 and 500),
  constraint jobs_moderation_status_check check (moderation_status in ('draft', 'pending', 'published', 'hidden', 'removed', 'archived'))
);

create trigger set_jobs_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

create index jobs_public_feed_idx
  on public.jobs (created_at desc)
  where moderation_status = 'published';

create index jobs_public_category_feed_idx
  on public.jobs (category, created_at desc)
  where moderation_status = 'published';

create index jobs_owner_status_idx
  on public.jobs (owner_id, moderation_status, updated_at desc);

alter table public.jobs enable row level security;

grant select on public.jobs to anon, authenticated;
grant insert, update on public.jobs to authenticated;
revoke delete on public.jobs from anon, authenticated;

create policy "Published jobs are publicly readable"
on public.jobs
for select
to anon, authenticated
using (moderation_status = 'published');

create policy "Job owners can read their own jobs"
on public.jobs
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Authenticated users can create their own jobs"
on public.jobs
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending')
);

create policy "Job owners can manage non-public job states"
on public.jobs
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and moderation_status in ('draft', 'pending', 'archived')
);

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by_profile_id uuid default auth.uid() references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contact_submissions_name_length_check check (char_length(trim(name)) between 1 and 120),
  constraint contact_submissions_email_length_check check (char_length(trim(email)) between 3 and 320 and position('@' in email) > 1),
  constraint contact_submissions_subject_length_check check (char_length(trim(subject)) between 1 and 180),
  constraint contact_submissions_message_length_check check (char_length(trim(message)) between 1 and 5000),
  constraint contact_submissions_status_check check (status in ('new', 'triaged', 'closed'))
);

create trigger set_contact_submissions_updated_at
before update on public.contact_submissions
for each row
execute function public.set_updated_at();

create index contact_submissions_status_created_idx
  on public.contact_submissions (status, created_at desc);

alter table public.contact_submissions enable row level security;

grant insert on public.contact_submissions to anon, authenticated;
revoke select, update, delete on public.contact_submissions from anon, authenticated;

create policy "Visitors can submit new contact notes"
on public.contact_submissions
for insert
to anon, authenticated
with check (status = 'new');

alter table public.jobs
  add column if not exists job_kind text not null default 'standard',
  add column if not exists event_id uuid null references public.events(id) on delete set null,
  add column if not exists work_start_date date null,
  add column if not exists work_end_date date null,
  add column if not exists time_blocks text[] not null default '{}'::text[],
  add column if not exists task_tags text[] not null default '{}'::text[],
  add column if not exists horse_count integer null,
  add column if not exists experience_level text null,
  add column if not exists transportation_available boolean not null default false,
  add column if not exists pay_amount_cents integer null,
  add column if not exists pay_type text null,
  add column if not exists is_urgent boolean not null default false,
  add column if not exists crew_status text not null default 'open';

alter table public.jobs
  drop constraint if exists jobs_job_kind_check,
  drop constraint if exists jobs_show_crew_dates_check,
  drop constraint if exists jobs_horse_count_check,
  drop constraint if exists jobs_experience_level_check,
  drop constraint if exists jobs_pay_amount_check,
  drop constraint if exists jobs_pay_type_check,
  drop constraint if exists jobs_crew_status_check;

alter table public.jobs
  add constraint jobs_job_kind_check
    check (job_kind in ('standard', 'show_crew')),
  add constraint jobs_show_crew_dates_check
    check (
      job_kind = 'standard'
      or (
        event_id is not null
        and work_start_date is not null
        and work_end_date is not null
        and work_end_date >= work_start_date
        and cardinality(time_blocks) > 0
        and cardinality(task_tags) > 0
      )
    ),
  add constraint jobs_horse_count_check
    check (horse_count is null or horse_count between 1 and 100),
  add constraint jobs_experience_level_check
    check (
      experience_level is null
      or experience_level in ('any', 'beginner', 'intermediate', 'experienced', 'professional')
    ),
  add constraint jobs_pay_amount_check
    check (pay_amount_cents is null or pay_amount_cents >= 0),
  add constraint jobs_pay_type_check
    check (
      pay_type is null
      or pay_type in ('total', 'daily', 'hourly', 'negotiable', 'unpaid')
    ),
  add constraint jobs_crew_status_check
    check (crew_status in ('open', 'filled', 'completed', 'cancelled'));

create index if not exists jobs_show_crew_event_status_idx
  on public.jobs (event_id, crew_status, work_start_date asc)
  where job_kind = 'show_crew' and moderation_status = 'published';

create index if not exists jobs_show_crew_open_dates_idx
  on public.jobs (work_end_date asc, is_urgent desc)
  where job_kind = 'show_crew' and moderation_status = 'published' and crew_status = 'open';

create table if not exists public.show_crew_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  message text not null,
  contact_details text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint show_crew_applications_message_length_check
    check (char_length(trim(message)) between 1 and 3000),
  constraint show_crew_applications_contact_length_check
    check (char_length(trim(contact_details)) between 3 and 500),
  constraint show_crew_applications_status_check
    check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  constraint show_crew_applications_job_applicant_key
    unique (job_id, applicant_id)
);

create unique index if not exists show_crew_applications_one_accepted_per_job_idx
  on public.show_crew_applications (job_id)
  where status = 'accepted';

create index if not exists show_crew_applications_applicant_status_idx
  on public.show_crew_applications (applicant_id, status, updated_at desc);

create index if not exists show_crew_applications_job_status_idx
  on public.show_crew_applications (job_id, status, created_at asc);

create trigger set_show_crew_applications_updated_at
before update on public.show_crew_applications
for each row
execute function public.set_updated_at();

alter table public.show_crew_applications enable row level security;

revoke all on table public.show_crew_applications from anon, authenticated;
grant all on table public.show_crew_applications to service_role;

create table if not exists public.show_crew_feedback (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.show_crew_applications(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null,
  reliability_rating smallint not null,
  communication_rating smallint not null,
  horse_care_rating smallint not null,
  would_hire_again boolean not null default true,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint show_crew_feedback_rating_check
    check (rating between 1 and 5),
  constraint show_crew_feedback_reliability_rating_check
    check (reliability_rating between 1 and 5),
  constraint show_crew_feedback_communication_rating_check
    check (communication_rating between 1 and 5),
  constraint show_crew_feedback_horse_care_rating_check
    check (horse_care_rating between 1 and 5),
  constraint show_crew_feedback_body_length_check
    check (char_length(trim(body)) between 1 and 3000)
);

create index if not exists show_crew_feedback_worker_created_idx
  on public.show_crew_feedback (worker_id, created_at desc);

create index if not exists show_crew_feedback_job_created_idx
  on public.show_crew_feedback (job_id, created_at desc);

create trigger set_show_crew_feedback_updated_at
before update on public.show_crew_feedback
for each row
execute function public.set_updated_at();

alter table public.show_crew_feedback enable row level security;

revoke all on table public.show_crew_feedback from anon, authenticated;
grant all on table public.show_crew_feedback to service_role;

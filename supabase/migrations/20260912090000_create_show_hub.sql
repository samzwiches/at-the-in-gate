create table if not exists public.event_attendance (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, profile_id),
  constraint event_attendance_status_check check (status in ('following', 'going'))
);

create table if not exists public.event_updates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  update_type text not null default 'general',
  body text not null,
  moderation_status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_updates_type_check check (
    update_type in ('general', 'ring', 'shipping', 'horse', 'help', 'vendor')
  ),
  constraint event_updates_body_check check (char_length(trim(body)) between 1 and 600),
  constraint event_updates_moderation_check check (
    moderation_status in ('published', 'hidden', 'removed')
  )
);

create index if not exists event_attendance_event_status_idx
  on public.event_attendance (event_id, status);

create index if not exists event_updates_event_created_idx
  on public.event_updates (event_id, created_at desc)
  where moderation_status = 'published';

drop trigger if exists set_event_attendance_updated_at on public.event_attendance;
create trigger set_event_attendance_updated_at
before update on public.event_attendance
for each row
execute function public.set_updated_at();

drop trigger if exists set_event_updates_updated_at on public.event_updates;
create trigger set_event_updates_updated_at
before update on public.event_updates
for each row
execute function public.set_updated_at();

alter table public.event_attendance enable row level security;
alter table public.event_updates enable row level security;

revoke all on public.event_attendance from anon, authenticated;
revoke all on public.event_updates from anon, authenticated;

grant select, insert (event_id, status), update (status), delete
  on public.event_attendance to authenticated;

grant select on public.event_updates to anon, authenticated;
grant insert (event_id, update_type, body) on public.event_updates to authenticated;
grant update (update_type, body) on public.event_updates to authenticated;
grant delete on public.event_updates to authenticated;

grant all on public.event_attendance to service_role;
grant all on public.event_updates to service_role;

create policy "Members can read show attendance"
on public.event_attendance
for select
to authenticated
using (true);

create policy "Members can set their show status"
on public.event_attendance
for insert
to authenticated
with check (profile_id = (select auth.uid()));

create policy "Members can update their show status"
on public.event_attendance
for update
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "Members can clear their show status"
on public.event_attendance
for delete
to authenticated
using (profile_id = (select auth.uid()));

create policy "Everyone can read published show updates"
on public.event_updates
for select
to anon, authenticated
using (moderation_status = 'published');

create policy "Active members can post show updates"
on public.event_updates
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and moderation_status = 'published'
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Authors can edit their show updates"
on public.event_updates
for update
to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and moderation_status = 'published'
);

create policy "Authors can remove their show updates"
on public.event_updates
for delete
to authenticated
using (author_id = (select auth.uid()));

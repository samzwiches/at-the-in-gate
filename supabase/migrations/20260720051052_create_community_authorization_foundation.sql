create table public.community_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  created_by_profile_id uuid references public.profiles(id) on delete set null,

  primary key (profile_id, role),
  constraint community_roles_role_check check (role in ('admin', 'moderator'))
);

create table public.community_spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint community_spaces_slug_format_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint community_spaces_title_length_check check (
    char_length(trim(title)) between 1 and 120
  ),
  constraint community_spaces_description_length_check check (
    description is null or char_length(description) <= 1000
  ),
  constraint community_spaces_sort_order_check check (sort_order >= 0)
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.community_spaces(id) on delete restrict,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  moderation_status text not null default 'published',
  is_pinned boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint community_posts_title_length_check check (
    char_length(trim(title)) between 1 and 240
  ),
  constraint community_posts_body_length_check check (
    char_length(trim(body)) between 1 and 20000
  ),
  constraint community_posts_moderation_status_check check (
    moderation_status in ('published', 'pending', 'hidden', 'removed')
  ),
  constraint community_posts_deleted_by_check check (
    (deleted_at is null and deleted_by_profile_id is null)
    or (deleted_at is not null and deleted_by_profile_id is not null)
  )
);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  parent_comment_id uuid references public.community_comments(id) on delete restrict,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  body text not null,
  moderation_status text not null default 'published',
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint community_comments_body_length_check check (
    char_length(trim(body)) between 1 and 10000
  ),
  constraint community_comments_moderation_status_check check (
    moderation_status in ('published', 'pending', 'hidden', 'removed')
  ),
  constraint community_comments_not_own_parent_check check (
    parent_comment_id is null or parent_comment_id <> id
  ),
  constraint community_comments_deleted_by_check check (
    (deleted_at is null and deleted_by_profile_id is null)
    or (deleted_at is not null and deleted_by_profile_id is not null)
  )
);

create table public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now(),

  constraint community_reactions_target_check check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  ),
  constraint community_reactions_type_check check (
    reaction_type in ('like', 'helpful', 'cheer')
  )
);

create unique index community_reactions_profile_post_type_idx
  on public.community_reactions (profile_id, post_id, reaction_type)
  where post_id is not null;

create unique index community_reactions_profile_comment_type_idx
  on public.community_reactions (profile_id, comment_id, reaction_type)
  where comment_id is not null;

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by_profile_id uuid references public.profiles(id) on delete set null,
  moderator_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint community_reports_target_check check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  ),
  constraint community_reports_reason_check check (
    reason in ('spam', 'harassment', 'misinformation', 'safety', 'other')
  ),
  constraint community_reports_status_check check (
    status in ('open', 'in_review', 'resolved', 'dismissed')
  ),
  constraint community_reports_details_length_check check (
    details is null or char_length(details) <= 2000
  ),
  constraint community_reports_notes_length_check check (
    moderator_notes is null or char_length(moderator_notes) <= 4000
  ),
  constraint community_reports_resolved_by_check check (
    (resolved_at is null and resolved_by_profile_id is null)
    or (resolved_at is not null and resolved_by_profile_id is not null)
  )
);

create index community_spaces_active_sort_idx
  on public.community_spaces (sort_order)
  where is_active;

create index community_posts_space_feed_idx
  on public.community_posts (space_id, created_at desc)
  where moderation_status = 'published' and deleted_at is null;

create index community_posts_author_idx
  on public.community_posts (author_id, created_at desc);

create index community_comments_post_feed_idx
  on public.community_comments (post_id, created_at asc)
  where moderation_status = 'published' and deleted_at is null;

create index community_comments_author_idx
  on public.community_comments (author_id, created_at desc);

create index community_comments_parent_idx
  on public.community_comments (parent_comment_id)
  where parent_comment_id is not null;

create index community_reports_open_queue_idx
  on public.community_reports (created_at asc)
  where status in ('open', 'in_review');

create trigger set_community_spaces_updated_at
before update on public.community_spaces
for each row
execute function public.set_updated_at();

create trigger set_community_posts_updated_at
before update on public.community_posts
for each row
execute function public.set_updated_at();

create trigger set_community_comments_updated_at
before update on public.community_comments
for each row
execute function public.set_updated_at();

create trigger set_community_reports_updated_at
before update on public.community_reports
for each row
execute function public.set_updated_at();

create or replace function private.has_community_role(
  p_profile_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.community_roles as community_role
    where community_role.profile_id = p_profile_id
      and community_role.role = any (p_roles)
  );
$$;

create or replace function private.set_community_post_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_at = now();
    new.deleted_by_profile_id = auth.uid();
  elsif new.deleted_at is null and old.deleted_at is not null then
    raise exception 'Soft-deleted community posts cannot be restored.';
  end if;

  if new.title is distinct from old.title or new.body is distinct from old.body then
    new.edited_at = now();
  end if;

  return new;
end;
$$;

create or replace function private.set_community_comment_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_at = now();
    new.deleted_by_profile_id = auth.uid();
  elsif new.deleted_at is null and old.deleted_at is not null then
    raise exception 'Soft-deleted community comments cannot be restored.';
  end if;

  if new.body is distinct from old.body then
    new.edited_at = now();
  end if;

  return new;
end;
$$;

create or replace function private.enforce_community_comment_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_comment_id is not null and (
    new.parent_comment_id = new.id
    or not exists (
      select 1
      from public.community_comments as parent_comment
      where parent_comment.id = new.parent_comment_id
        and parent_comment.post_id = new.post_id
    )
  ) then
    raise exception 'A parent comment must belong to the same post.';
  end if;

  return new;
end;
$$;

create or replace function private.set_community_report_resolution()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('resolved', 'dismissed') and old.status is distinct from new.status then
    new.resolved_at = now();
    new.resolved_by_profile_id = auth.uid();
  elsif new.status in ('open', 'in_review') then
    new.resolved_at = null;
    new.resolved_by_profile_id = null;
  end if;

  return new;
end;
$$;

create trigger set_community_posts_audit
before update on public.community_posts
for each row
execute function private.set_community_post_audit();

create trigger set_community_comments_audit
before update on public.community_comments
for each row
execute function private.set_community_comment_audit();

create trigger enforce_community_comment_parent
before insert or update of post_id, parent_comment_id on public.community_comments
for each row
execute function private.enforce_community_comment_parent();

create trigger set_community_reports_resolution
before update on public.community_reports
for each row
execute function private.set_community_report_resolution();

revoke all on function private.has_community_role(uuid, text[]) from public;
revoke all on function private.set_community_post_audit() from public;
revoke all on function private.set_community_comment_audit() from public;
revoke all on function private.enforce_community_comment_parent() from public;
revoke all on function private.set_community_report_resolution() from public;
grant usage on schema private to authenticated;
grant execute on function private.has_community_role(uuid, text[]) to authenticated;

alter table public.community_roles enable row level security;
alter table public.community_spaces enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;

revoke all on public.community_roles from anon, authenticated;
revoke all on public.community_spaces from anon, authenticated;
revoke all on public.community_posts from anon, authenticated;
revoke all on public.community_comments from anon, authenticated;
revoke all on public.community_reactions from anon, authenticated;
revoke all on public.community_reports from anon, authenticated;

grant select on public.community_spaces to authenticated;
grant select, insert (space_id, title, body), update (title, body, deleted_at)
  on public.community_posts to authenticated;
grant select, insert (post_id, parent_comment_id, body), update (body, deleted_at)
  on public.community_comments to authenticated;
grant select, insert (post_id, comment_id, reaction_type), delete
  on public.community_reactions to authenticated;
grant select, insert (post_id, comment_id, reason, details), update (status, moderator_notes)
  on public.community_reports to authenticated;

grant all on public.community_roles to service_role;
grant all on public.community_spaces to service_role;
grant all on public.community_posts to service_role;
grant all on public.community_comments to service_role;
grant all on public.community_reactions to service_role;
grant all on public.community_reports to service_role;

create policy "Active members can read active community spaces"
on public.community_spaces
for select
to authenticated
using (
  is_active
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active members can read published community posts"
on public.community_posts
for select
to authenticated
using (
  moderation_status = 'published'
  and deleted_at is null
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active members can read their own community posts"
on public.community_posts
for select
to authenticated
using (
  author_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active moderators can read all community posts"
on public.community_posts
for select
to authenticated
using (
  (select private.has_active_membership((select auth.uid())))
  and (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
);

create policy "Active members can create their own community posts"
on public.community_posts
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and moderation_status = 'published'
  and (select private.has_active_membership((select auth.uid())))
  and exists (
    select 1
    from public.community_spaces as space
    where space.id = space_id
      and space.is_active
  )
);

create policy "Active members can update their own community posts"
on public.community_posts
for update
to authenticated
using (
  author_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
)
with check (
  author_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active members can read published community comments"
on public.community_comments
for select
to authenticated
using (
  moderation_status = 'published'
  and deleted_at is null
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active members can read their own community comments"
on public.community_comments
for select
to authenticated
using (
  author_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active moderators can read all community comments"
on public.community_comments
for select
to authenticated
using (
  (select private.has_active_membership((select auth.uid())))
  and (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
);

create policy "Active members can create their own community comments"
on public.community_comments
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and moderation_status = 'published'
  and (select private.has_active_membership((select auth.uid())))
  and exists (
    select 1
    from public.community_posts as post
    where post.id = post_id
      and post.moderation_status = 'published'
      and post.deleted_at is null
  )
);

create policy "Active members can update their own community comments"
on public.community_comments
for update
to authenticated
using (
  author_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
)
with check (
  author_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active members can read reactions on visible content"
on public.community_reactions
for select
to authenticated
using (
  (select private.has_active_membership((select auth.uid())))
  and (
    (post_id is not null and exists (
      select 1 from public.community_posts as post where post.id = post_id
    ))
    or (comment_id is not null and exists (
      select 1 from public.community_comments as comment where comment.id = comment_id
    ))
  )
);

create policy "Active members can add reactions to visible content"
on public.community_reactions
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
  and (
    (post_id is not null and exists (
      select 1 from public.community_posts as post where post.id = post_id
    ))
    or (comment_id is not null and exists (
      select 1 from public.community_comments as comment where comment.id = comment_id
    ))
  )
);

create policy "Active members can remove their own reactions"
on public.community_reactions
for delete
to authenticated
using (
  profile_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active members can read their own community reports"
on public.community_reports
for select
to authenticated
using (
  reporter_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
);

create policy "Active moderators can read community reports"
on public.community_reports
for select
to authenticated
using (
  (select private.has_active_membership((select auth.uid())))
  and (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
);

create policy "Active members can report visible community content"
on public.community_reports
for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and (select private.has_active_membership((select auth.uid())))
  and (
    (post_id is not null and exists (
      select 1 from public.community_posts as post where post.id = post_id
    ))
    or (comment_id is not null and exists (
      select 1 from public.community_comments as comment where comment.id = comment_id
    ))
  )
);

create policy "Active moderators can resolve community reports"
on public.community_reports
for update
to authenticated
using (
  (select private.has_active_membership((select auth.uid())))
  and (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
)
with check (
  (select private.has_active_membership((select auth.uid())))
  and (select private.has_community_role((select auth.uid()), array['admin', 'moderator']))
);

insert into public.community_spaces (slug, title, sort_order, is_active)
values
  ('barn-aisle', 'Barn Aisle', 10, true),
  ('hunter-and-equitation', 'Hunter and Equitation', 20, true),
  ('pony-parents', 'Pony Parents', 30, true),
  ('buying-selling-and-leasing', 'Buying, Selling and Leasing', 40, true),
  ('horse-show-help', 'Horse Show Help', 50, true),
  ('shipping-and-transportation', 'Shipping and Transportation', 60, true),
  ('barn-life', 'Barn Life', 70, true),
  ('jobs-and-working-students', 'Jobs and Working Students', 80, true),
  ('off-topic', 'Off Topic', 90, true)
on conflict (slug) do nothing;

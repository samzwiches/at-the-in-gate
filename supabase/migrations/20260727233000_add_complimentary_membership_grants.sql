create table if not exists public.membership_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  grant_type text not null default 'complimentary',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  note text,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_grants_profile_key unique (profile_id),
  constraint membership_grants_type_check check (
    grant_type in ('founding', 'complimentary', 'partner', 'moderator')
  ),
  constraint membership_grants_date_order_check check (
    ends_at is null or ends_at > starts_at
  ),
  constraint membership_grants_note_length_check check (
    note is null or char_length(note) <= 1000
  )
);

create index if not exists membership_grants_active_idx
  on public.membership_grants (profile_id, ends_at)
  where revoked_at is null;

drop trigger if exists set_membership_grants_updated_at on public.membership_grants;
create trigger set_membership_grants_updated_at
before update on public.membership_grants
for each row
execute function public.set_updated_at();

alter table public.membership_grants enable row level security;

revoke all on table public.membership_grants from anon, authenticated;
grant all on table public.membership_grants to service_role;

create or replace function private.has_active_membership(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.community_roles as community_role
      where community_role.profile_id = p_profile_id
        and community_role.role = 'admin'
    )
    or exists (
      select 1
      from public.membership_grants as membership_grant
      where membership_grant.profile_id = p_profile_id
        and membership_grant.revoked_at is null
        and membership_grant.starts_at <= now()
        and (
          membership_grant.ends_at is null
          or membership_grant.ends_at > now()
        )
    )
    or exists (
      select 1
      from public.membership_subscriptions as subscription
      join public.billing_customers as customer
        on customer.id = subscription.billing_customer_id
      left join public.membership_plans as plan
        on plan.id = subscription.membership_plan_id
      where customer.profile_id = p_profile_id
        and (
          (
            subscription.status in ('active', 'trialing')
            and (
              subscription.cancel_at_period_end = false
              or subscription.current_period_end > now()
            )
          )
          or (
            subscription.status = 'past_due'
            and now() < (
              coalesce(
                subscription.current_period_end,
                subscription.last_stripe_event_created_at
              )
              + make_interval(days => coalesce(plan.past_due_grace_days, 7))
            )
          )
        )
    );
$$;

create or replace function public.grant_founding_access(
  p_email text,
  p_months integer default 12,
  p_note text default 'Founding member'
)
returns table (
  profile_id uuid,
  member_email text,
  grant_type text,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  if p_months < 1 or p_months > 120 then
    raise exception 'Grant months must be between 1 and 120.';
  end if;

  select auth_user.id
  into v_profile_id
  from auth.users as auth_user
  where lower(auth_user.email) = lower(trim(p_email))
  limit 1;

  if v_profile_id is null then
    raise exception 'No At The In Gate account exists for email %.', p_email;
  end if;

  insert into public.membership_grants (
    profile_id,
    grant_type,
    starts_at,
    ends_at,
    revoked_at,
    note
  )
  values (
    v_profile_id,
    'founding',
    now(),
    now() + make_interval(months => p_months),
    null,
    nullif(trim(p_note), '')
  )
  on conflict (profile_id) do update
  set
    grant_type = 'founding',
    starts_at = now(),
    ends_at = now() + make_interval(months => p_months),
    revoked_at = null,
    note = nullif(trim(p_note), '');

  return query
  select
    membership_grant.profile_id,
    auth_user.email::text,
    membership_grant.grant_type,
    membership_grant.ends_at
  from public.membership_grants as membership_grant
  join auth.users as auth_user
    on auth_user.id = membership_grant.profile_id
  where membership_grant.profile_id = v_profile_id;
end;
$$;

create or replace function public.revoke_complimentary_access(p_email text)
returns table (
  profile_id uuid,
  member_email text,
  revoked_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  select auth_user.id
  into v_profile_id
  from auth.users as auth_user
  where lower(auth_user.email) = lower(trim(p_email))
  limit 1;

  if v_profile_id is null then
    raise exception 'No At The In Gate account exists for email %.', p_email;
  end if;

  update public.membership_grants
  set revoked_at = now()
  where membership_grants.profile_id = v_profile_id;

  if not found then
    raise exception 'No complimentary access grant exists for email %.', p_email;
  end if;

  return query
  select
    membership_grant.profile_id,
    auth_user.email::text,
    membership_grant.revoked_at
  from public.membership_grants as membership_grant
  join auth.users as auth_user
    on auth_user.id = membership_grant.profile_id
  where membership_grant.profile_id = v_profile_id;
end;
$$;

revoke all on function private.has_active_membership(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_active_membership(uuid) to authenticated;

revoke all on function public.grant_founding_access(text, integer, text) from public;
revoke all on function public.revoke_complimentary_access(text) from public;
grant execute on function public.grant_founding_access(text, integer, text) to service_role;
grant execute on function public.revoke_complimentary_access(text) to service_role;

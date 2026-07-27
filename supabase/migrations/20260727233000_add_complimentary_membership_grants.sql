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

revoke all on function private.has_active_membership(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_active_membership(uuid) to authenticated;

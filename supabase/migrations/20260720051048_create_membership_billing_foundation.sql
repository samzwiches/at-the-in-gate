create schema if not exists private;
revoke all on schema private from public;

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  stripe_price_id text unique,
  past_due_grace_days smallint not null default 7,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_plans_slug_format_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint membership_plans_name_length_check check (
    char_length(trim(name)) between 1 and 120
  ),
  constraint membership_plans_description_length_check check (
    description is null or char_length(description) <= 1000
  ),
  constraint membership_plans_grace_days_check check (
    past_due_grace_days between 0 and 30
  )
);

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_customers_stripe_customer_id_check check (
    char_length(trim(stripe_customer_id)) > 0
  )
);

create table public.membership_subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete cascade,
  membership_plan_id uuid references public.membership_plans(id) on delete set null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  last_invoice_status text,
  last_stripe_event_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_subscriptions_status_check check (
    status in (
      'active',
      'trialing',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'paused',
      'unpaid',
      'ended'
    )
  ),
  constraint membership_subscriptions_stripe_subscription_id_check check (
    char_length(trim(stripe_subscription_id)) > 0
  ),
  constraint membership_subscriptions_stripe_price_id_check check (
    char_length(trim(stripe_price_id)) > 0
  ),
  constraint membership_subscriptions_period_order_check check (
    current_period_end is null
    or current_period_start is null
    or current_period_end >= current_period_start
  )
);

create table private.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  stripe_created_at timestamptz not null,
  payload jsonb not null,
  processing_status text not null default 'received',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,

  constraint stripe_webhook_events_status_check check (
    processing_status in ('received', 'processed', 'ignored', 'failed')
  ),
  constraint stripe_webhook_events_id_check check (
    char_length(trim(stripe_event_id)) > 0
  ),
  constraint stripe_webhook_events_type_check check (
    char_length(trim(event_type)) > 0
  )
);

create index membership_subscriptions_customer_status_idx
  on public.membership_subscriptions (billing_customer_id, status, current_period_end desc);

create index membership_subscriptions_plan_idx
  on public.membership_subscriptions (membership_plan_id)
  where membership_plan_id is not null;

create index stripe_webhook_events_received_idx
  on private.stripe_webhook_events (received_at desc);

create trigger set_membership_plans_updated_at
before update on public.membership_plans
for each row
execute function public.set_updated_at();

create trigger set_billing_customers_updated_at
before update on public.billing_customers
for each row
execute function public.set_updated_at();

create trigger set_membership_subscriptions_updated_at
before update on public.membership_subscriptions
for each row
execute function public.set_updated_at();

create or replace function private.has_active_membership(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
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

-- The Data API cannot address the private schema. These invoker functions are
-- callable only by the server's service-role client and never elevate browser
-- permissions.
create or replace function public.record_stripe_webhook_event(
  p_stripe_event_id text,
  p_event_type text,
  p_stripe_created_at timestamptz,
  p_payload jsonb
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  did_insert boolean;
begin
  insert into private.stripe_webhook_events (
    stripe_event_id,
    event_type,
    stripe_created_at,
    payload
  )
  values (
    p_stripe_event_id,
    p_event_type,
    p_stripe_created_at,
    p_payload
  )
  on conflict (stripe_event_id) do nothing
  returning true into did_insert;

  return coalesce(did_insert, false);
end;
$$;

create or replace function public.complete_stripe_webhook_event(
  p_stripe_event_id text,
  p_processing_status text,
  p_processing_error text default null
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update private.stripe_webhook_events
  set
    processing_status = p_processing_status,
    processing_error = p_processing_error,
    processed_at = case
      when p_processing_status in ('processed', 'ignored', 'failed') then now()
      else null
    end
  where stripe_event_id = p_stripe_event_id;
end;
$$;

revoke all on function private.has_active_membership(uuid) from public;
revoke all on function public.record_stripe_webhook_event(text, text, timestamptz, jsonb) from public;
revoke all on function public.complete_stripe_webhook_event(text, text, text) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_active_membership(uuid) to authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.stripe_webhook_events to service_role;
grant execute on function public.record_stripe_webhook_event(text, text, timestamptz, jsonb) to service_role;
grant execute on function public.complete_stripe_webhook_event(text, text, text) to service_role;

alter table public.membership_plans enable row level security;
alter table public.billing_customers enable row level security;
alter table public.membership_subscriptions enable row level security;
alter table private.stripe_webhook_events enable row level security;

revoke all on public.membership_plans from anon, authenticated;
revoke all on public.billing_customers from anon, authenticated;
revoke all on public.membership_subscriptions from anon, authenticated;

grant all on public.membership_plans to service_role;
grant all on public.billing_customers to service_role;
grant all on public.membership_subscriptions to service_role;

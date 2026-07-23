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
  did_claim boolean;
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
  on conflict (stripe_event_id) do update
  set
    processing_status = 'received',
    processing_error = null,
    processed_at = null,
    received_at = now()
  where private.stripe_webhook_events.processing_status = 'failed'
     or (
       private.stripe_webhook_events.processing_status = 'received'
       and private.stripe_webhook_events.received_at < now() - interval '5 minutes'
     )
  returning true into did_claim;

  return coalesce(did_claim, false);
end;
$$;

create or replace function public.sync_membership_subscription(
  p_billing_customer_id uuid,
  p_membership_plan_id uuid,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_trial_end timestamptz,
  p_cancel_at_period_end boolean,
  p_canceled_at timestamptz,
  p_ended_at timestamptz,
  p_last_invoice_status text,
  p_last_stripe_event_created_at timestamptz
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  did_sync boolean;
begin
  insert into public.membership_subscriptions (
    billing_customer_id,
    membership_plan_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_start,
    current_period_end,
    trial_end,
    cancel_at_period_end,
    canceled_at,
    ended_at,
    last_invoice_status,
    last_stripe_event_created_at
  )
  values (
    p_billing_customer_id,
    p_membership_plan_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_trial_end,
    p_cancel_at_period_end,
    p_canceled_at,
    p_ended_at,
    p_last_invoice_status,
    p_last_stripe_event_created_at
  )
  on conflict (stripe_subscription_id) do update
  set
    billing_customer_id = excluded.billing_customer_id,
    membership_plan_id = excluded.membership_plan_id,
    stripe_price_id = excluded.stripe_price_id,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    trial_end = excluded.trial_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    canceled_at = excluded.canceled_at,
    ended_at = excluded.ended_at,
    last_invoice_status = excluded.last_invoice_status,
    last_stripe_event_created_at = excluded.last_stripe_event_created_at
  where public.membership_subscriptions.last_stripe_event_created_at
    <= excluded.last_stripe_event_created_at
  returning true into did_sync;

  return coalesce(did_sync, false);
end;
$$;

revoke all on function public.record_stripe_webhook_event(text, text, timestamptz, jsonb) from public;
revoke all on function public.sync_membership_subscription(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz,
  boolean,
  timestamptz,
  timestamptz,
  text,
  timestamptz
) from public;

grant execute on function public.record_stripe_webhook_event(text, text, timestamptz, jsonb) to service_role;
grant execute on function public.sync_membership_subscription(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz,
  boolean,
  timestamptz,
  timestamptz,
  text,
  timestamptz
) to service_role;

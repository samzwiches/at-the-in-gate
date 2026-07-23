revoke all on function public.record_stripe_webhook_event(text, text, timestamptz, jsonb) from anon, authenticated;
revoke all on function public.complete_stripe_webhook_event(text, text, text) from anon, authenticated;
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
) from anon, authenticated;

grant execute on function public.record_stripe_webhook_event(text, text, timestamptz, jsonb) to service_role;
grant execute on function public.complete_stripe_webhook_event(text, text, text) to service_role;
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

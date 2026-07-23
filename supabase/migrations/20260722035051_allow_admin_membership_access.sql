-- Keep paid-member access in one place: RLS policies already call this helper.
-- Administrators receive community access through a server-assigned role, not
-- through browser-provided metadata or a Stripe subscription.
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

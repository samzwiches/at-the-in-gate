# Community authorization foundation

The native community is membership-gated. Anonymous visitors cannot read or create community content. Authenticated members must have an entitled membership state before Row Level Security permits community reads, posts, comments, reactions, or reports.

## Entitlement

`private.has_active_membership(profile_id)` is the database source for RLS. It grants access to server-assigned `admin` roles, then applies subscription entitlement for everyone else: `active` and `trialing` subscriptions, cancellation-at-period-end through the recorded period end, and the membership plan's configurable past-due grace period. Canceled, unpaid, incomplete-expired, ended, paused, and incomplete subscriptions are not entitled.

The server-only TypeScript membership helper mirrors those same rules for protected pages and Stripe routes. Stripe webhooks—not success-page parameters—write normalized billing state.

## Community roles

`public.community_roles` holds only `admin` and `moderator` assignments. The role helper is private and security-definer with a locked search path. No email address or user metadata is used for authorization, and browser roles receive no permission to insert, update, or delete role assignments.

## Future community identity view

The existing `public.profiles` RLS remains unchanged: private profiles stay private. When the feed is built, use a narrowly scoped `public.community_member_identities` view or server query that exposes only:

- `profiles.id`
- `profiles.display_name`
- `profiles.avatar_path`

It must filter to authors whose profile is public, or return an intentional neutral member label for private profiles. Do not expose email, bio, location, username, or any billing data through the community identity surface. If a view is used, create it with `security_invoker = true` and grant only the access required by active-member policies.

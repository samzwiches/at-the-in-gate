# Show Hub — Phase 1

This phase turns the existing event detail page into a connected show hub.

## What changed

- The event page now has anchored sections for Overview, In Gate, Horses, People, Services, and Jobs.
- Existing event-linked marketplace listings appear as "Horses at this show."
- Existing Show Crew jobs remain attached to the show.
- Existing organizer and reviews remain in place.
- Members can mark a show as `following` or `going`.
- Active members can post short show-specific "In Gate" updates.
- The hub surfaces counts for going, following, linked horses, and live updates.

## Database migration

Apply:

`supabase/migrations/20260912090000_create_show_hub.sql`

It creates:

- `event_attendance`
- `event_updates`

The migration enables RLS. Signed-in members can manage their own show status. Published In Gate updates are publicly readable; posting requires active membership.

## Next recommended phase

1. Connect professional/directory profiles to events so "Who's Here" can populate from real attendance.
2. Add event-aware marketplace form controls so sellers can explicitly mark a horse as available to try.
3. Add update reporting/moderation and author editing/removal.
4. Add show-follow notifications.
5. Build the personalized "The In Gate" feed from followed shows, horses, professionals, and community activity.

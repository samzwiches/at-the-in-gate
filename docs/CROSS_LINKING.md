# Cross-linking and relationship layer

At The In Gate uses `public.directory_entries` as the canonical public identity for a person, barn, business, organization, venue, shipper, or service provider. A listing, service, route, job, or event never creates a duplicate public identity.

## Relationship records

- `listing_directory_relationships` links a marketplace listing to a directory entry as a seller, trainer, barn, shipper, or service provider.
- `listing_event_relationships` links a listing to one or more approved events.
- `jobs.directory_entry_id` optionally identifies the employer while retaining the written employer field.
- `events.organizer_directory_entry_id` optionally identifies the organizer while retaining venue and contact copy.
- `service_offerings` belongs to one directory entry.
- `shipping_routes` belongs to one directory entry in the `shippers` category.

Legacy free-text fields are intentionally preserved. No migration attempts to guess, replace, or delete earlier text.

## Reviews

`reviews` has exactly one foreign-key target: a directory entry, marketplace listing, service offering, shipping route, or event. The schema prevents a second active review by the same author for the same target. Authors cannot review records they own, cannot change a review target, and can soft-delete but not restore a review. Moderators control publication.

## Visibility and authorization

- Public relationship rows are visible only when both sides are public: published listings/events/services/routes/reviews and approved directory entries.
- Owners can manage only records attached to a directory entry or listing they own.
- Administrators are authorized through `public.community_roles`; no browser role flag is trusted.
- Forms submit IDs only as references. PostgreSQL foreign keys, triggers, and RLS verify ownership, category compatibility, target status, and moderation state.
- Public page components do not read or expose private profile fields.

## Manual linking

Existing records remain unlinked until their owner selects an approved directory entry or event in the relevant form. This is deliberate: a matching name is not proof of identity.

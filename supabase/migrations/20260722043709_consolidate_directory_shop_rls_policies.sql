drop policy "Approved directory entries are publicly readable" on public.directory_entries;
drop policy "Directory owners can read their own entries" on public.directory_entries;
drop policy "Directory administrators can review entries" on public.directory_entries;
drop policy "Directory owners can manage non-public states" on public.directory_entries;
drop policy "Directory administrators can moderate entries" on public.directory_entries;

create policy "Approved directory entries are publicly readable"
on public.directory_entries
for select
to anon
using (moderation_status = 'published');

create policy "Authenticated directory access is scoped"
on public.directory_entries
for select
to authenticated
using (
  moderation_status = 'published'
  or owner_id = (select auth.uid())
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Directory owner and administrator updates are scoped"
on public.directory_entries
for update
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (
    owner_id = (select auth.uid())
    and moderation_status in ('draft', 'pending', 'archived')
  )
  or (
    (select private.has_community_role((select auth.uid()), array['admin']::text[]))
    and moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

drop policy "Approved shop items are publicly readable" on public.shop_items;
drop policy "Shop owners can read their own items" on public.shop_items;
drop policy "Shop administrators can review items" on public.shop_items;
drop policy "Shop owners can manage non-public states" on public.shop_items;
drop policy "Shop administrators can moderate items" on public.shop_items;

create policy "Approved shop items are publicly readable"
on public.shop_items
for select
to anon
using (moderation_status = 'published');

create policy "Authenticated shop access is scoped"
on public.shop_items
for select
to authenticated
using (
  moderation_status = 'published'
  or owner_id = (select auth.uid())
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
);

create policy "Shop owner and administrator updates are scoped"
on public.shop_items
for update
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.has_community_role((select auth.uid()), array['admin']::text[]))
)
with check (
  (
    owner_id = (select auth.uid())
    and moderation_status in ('draft', 'pending', 'archived')
  )
  or (
    (select private.has_community_role((select auth.uid()), array['admin']::text[]))
    and moderation_status in ('draft', 'pending', 'published', 'rejected', 'archived')
  )
);

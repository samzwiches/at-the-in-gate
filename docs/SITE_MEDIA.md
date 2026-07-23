# Site media and appearance

`/admin/site-media` is the unified Media + Appearance desk for At The In Gate’s fixed layouts. It is intentionally not a page builder: administrators can manage approved images and safe appearance treatments without storing HTML, CSS classes, layout rules, or page copy.

Normal saves update Supabase and revalidate the affected route. They do not need a deployment, publish action, or rebuild. A public page that was already open in another tab may need a browser refresh.

## Media slots

| Media key | Page | Placement | Original reset state |
| --- | --- | --- | --- |
| `home.hero` | Home | Feature-panel hero | The existing braided-pony editorial image |
| `home.community_background` | Home | Community section background | Current pale blue-gray treatment |
| `marketplace.hero` | Marketplace | Page heading | Current cream market-board treatment |
| `community.hero` | Community | Page heading | Current pale blue-gray member-space treatment |
| `events.hero` | Events | Page heading | Current cream show-circuit treatment |
| `directory.hero` | Directory | Page heading | Current warm directory treatment |
| `jobs.hero` | Jobs | Page heading | Current cream barn-calls treatment |
| `membership.hero` | Membership | Page heading | Current cream member-pass treatment |
| `shop.hero` | Shop | Page heading | Current warm tack-trunk treatment |
| `about.hero` | About | Editorial opening | Current About opening treatment |
| `contact.hero` | Contact | Page heading | Current Contact opening treatment |
| `services.hero` | Services | Page heading | Current services introduction |
| `shippers.hero` | Shippers | Page heading | Current shipping-routes introduction |
| `footer.background` | Footer | Sitewide footer background | Current charcoal footer treatment |

Each media assignment supports a primary JPG, PNG, or WebP image up to 6 MB, an optional mobile crop, focal point, alt text, optional caption, a preset overlay tone, an optional custom overlay color, and independent overlay opacity. Captions are stored but are not currently rendered publicly.

Preset overlay tones remain `none`, `light`, `dark`, `cream`, and `brand`. A valid custom hexadecimal overlay takes precedence over its preset tone. Clearing it restores the preset tone. Existing media rows without a custom overlay continue to render normally.

## Appearance keys and scope

`public.site_section_appearance` stores optional safe presentation overrides. Empty values always preserve the source-controlled design.

### Shared shell and fixed sections

```text
header
footer
home.hero
home.community
marketplace.hero
community.hero
events.hero
directory.hero
jobs.hero
membership.hero
shop.hero
about.hero
contact.hero
services.hero
shippers.hero
```

### Page canvases

```text
home.page
marketplace.page
community.page
events.page
directory.page
jobs.page
membership.page
shop.page
about.page
contact.page
services.page
shippers.page
```

The editor’s central key registry controls labels, section kind, applicable fields, and targeted revalidation paths. There is no second, drifting allowlist.

| Section kind | Supported fields |
| --- | --- |
| Page canvas | `background_color` only. It changes only the approved route canvas. |
| Hero | Existing approved font/text fields plus `background_color`, `surface_color`, `border_color`, `hero_edge_style`, and `hero_edge_size`. |
| Home community section | Existing approved font/text fields plus `background_color`, `surface_color`, and `border_color`. |
| Header | Existing font, default text, and navigation text fields plus `background_color` and `border_color`. |
| Footer | Existing approved font/text fields plus `background_color`, `surface_color`, and `border_color`. |

`background_color` changes the approved outer page, hero, or section wrapper. `surface_color` is limited to an existing inner hero/section/footer content surface; it does not recolor cards. `border_color` is limited to the approved wrapper border.

Page canvases provide `--page-background-color` to their hero. A soft hero fade therefore blends toward the actual saved page canvas color, or the exact source-controlled page color when no row exists.

## Color and font handling

The allowed text fields are default, eyebrow, heading, body, button, metadata, and navigation text colors where their fixed section already uses them. The only font choices are `inherit`, `serif`, and `sans`.

All color inputs accept `#112233`, `112233`, `#abc`, and `abc`, then save normalized lowercase `#rrggbb`. Named colors, `rgb()`, `hsl()`, CSS variables, gradients, arbitrary CSS, and malformed values are rejected by both the editor and server.

Saved text values are emitted only as scoped custom properties:

```text
--section-default-color
--section-eyebrow-color
--section-heading-color
--section-body-color
--section-button-color
--section-metadata-color
--section-navigation-color
--section-font-family
```

Values are emitted only when saved. The static source styles remain the exact fallback when a row or field is absent. Dynamic Tailwind classes are never built from administrator input.

## Hero edges

Hero edge treatment is fixed and controlled by two safe fields:

| Stored value | Editor label | Result |
| --- | --- | --- |
| `inherit` | Use current design | Leaves the current source treatment unchanged. |
| `soft-fade` | Soft fade | Keeps a rectangle and softly fades its lower edge into the inherited page background. |
| `rounded` | Rounded | Uses a controlled radius. |
| `rounded-fade` | Rounded with fade | Combines the controlled radius and soft lower fade. |
| `none` | Hard rectangle | Removes fade and rounding. |

`hero_edge_size` is an integer from 0 through 96 pixels. A rounded hero without a saved size uses 20px; a soft fade without a saved size uses 24px. The fade is a source-controlled presentation layer only—it never edits the image file. Header, footer, `home.community`, and all `.page` keys never expose edge controls.

## Reset, contrast, and security

Media reset and appearance reset are deliberately separate:

- **Reset to existing default** deletes only the `site_media` assignment and associated unreferenced storage objects. It does not change appearance rows.
- **Reset appearance** deletes only that key’s `site_section_appearance` row. It retains assigned media, crop, alt text, mobile crop, overlay tone, custom overlay color, and overlay opacity.

The editor warns about low contrast for heading, body, and metadata text on known solid treatments. Image-backed heroes can never guarantee text contrast from a hex value alone, so administrators should check the assigned image and image overlay before saving.

Button text is stricter: it must meet WCAG AA normal-text contrast of 4.5:1 against both hunter green `#2d4737` and oxblood `#7b2430`. The browser previews the result and the server enforces it before writing.

Only users with the existing `community_roles` `admin` role can write media or appearance data. The server authenticates and authorizes before using the service-role client, ignores client-supplied `updated_by`, validates the central section key and field applicability, and writes the authenticated profile ID itself. Public visitors may read the fixed assignments needed to render public pages.

## Revalidation

Saving an appearance revalidates its configured public route plus `/admin` and `/admin/site-media`; header and footer saves also revalidate the root layout. Page keys target their matching routes:

```text
home.page -> /
marketplace.page -> /marketplace
community.page -> /community
events.page -> /events
directory.page -> /directory
jobs.page -> /jobs
membership.page -> /membership
shop.page -> /shop
about.page -> /about
contact.page -> /contact
services.page -> /services
shippers.page -> /shippers
```

## Explicit exclusions

This system does **not** edit page copy, navigation links, listing/directory/service/shipper/job/event/shop/community card backgrounds, filter buttons, search results, result grids, category navigation, forms, tables, dashboard or unrelated admin cards, empty states, individual detail pages, button backgrounds, hover/focus treatments, shadows, arbitrary border radii, gradients, masks, fonts, CSS, animation timing, spacing, card layouts, or route structure.

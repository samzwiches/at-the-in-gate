# Site media

Site media changes the image treatment inside fixed At The In Gate layouts. It is intentionally not a page builder: no HTML, CSS classes, spacing controls, or arbitrary placements are stored in the database.

## Current slots

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
| `footer.background` | Footer | Sitewide footer background | Current charcoal footer treatment |

The image slots are grouped in `/admin/site-media`. Resetting a slot removes its assignment and restores the listed original treatment. Only `home.hero` has a built-in local image today; the other original states intentionally remain the visual treatments already on the site.

## What administrators can control

- A primary JPG, PNG, or WebP image up to 6 MB.
- An optional separate mobile crop.
- Image focal point (`focal_x`, `focal_y`) from 0 to 100.
- Alt text, optional caption, overlay tone, and overlay strength.

The supported overlay tones are `none`, `light`, `dark`, `cream`, and `brand`. Images render as controlled full-bleed heroes, contained editorial images, card images, section backgrounds, or subtle textures according to the fixed slot component—not through database-provided classes or styles.

## Security and storage

- Files are stored in the private `site-media` bucket under server-generated paths.
- Server-side validation checks file size, declared MIME type, and image file signatures.
- Only users holding the existing `community_roles` `admin` role can create, replace, update, reset, or delete assignments.
- Public visitors can read only image objects currently referenced by an allowed `site_media` assignment.
- Replaced objects are removed only after no remaining assignment references them.

The browser never receives a service-role key. The editor sends its changes to the authenticated, administrator-checked `/api/admin/site-media` route.

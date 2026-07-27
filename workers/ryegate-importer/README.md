# Ryegate show importer

This is a standalone Cloudflare Worker. It scrapes Ryegate's public zone calendars and writes the results to the private `public.event_imports` staging table in Supabase.

It does not publish records into `public.events` automatically.

## What it imports

The Worker checks these public Ryegate schedule pages:

- Zones 1 through 10
- Canada

For each show it stores the title, dates, city, state, zone, affiliations, contact, source URL, and the original parsed values.

## Schedule

The cron expression is `0 7 * * *`, which runs daily at 7:00 AM UTC, approximately 3:00 AM Eastern during daylight saving time.

## Required setup

Apply the Supabase migration first:

```text
supabase/migrations/20260727015000_create_event_imports.sql
```

From this folder, install dependencies:

```bash
npm install
```

Add the encrypted Cloudflare secrets:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put IMPORTER_TOKEN
```

`SUPABASE_URL` is already configured as a non-secret Worker variable in `wrangler.jsonc`.

Deploy the standalone Worker:

```bash
npm run deploy
```

## Manual run

The health endpoint is public:

```text
GET /health
```

A manual import requires the secret token:

```bash
curl -H "Authorization: Bearer YOUR_IMPORTER_TOKEN" \
  https://at-the-in-gate-ryegate-importer.slduthie.workers.dev/run
```

The same import runs automatically on the daily cron schedule.

## Safety

- Supabase's service-role key is never stored in GitHub.
- Imported records remain in a private staging table.
- Repeated runs upsert by source and external ID rather than creating duplicates.
- Existing review decisions are preserved when a source record is refreshed.

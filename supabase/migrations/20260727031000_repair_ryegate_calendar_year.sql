-- Ryegate calendar rows omit the season year. The first importer release
-- accidentally read the site's 2003 copyright year and applied it to show dates.
-- Repair any affected staging records and public events for the 2026 season.

begin;

update public.events
set
  start_date = (start_date + interval '23 years')::date,
  end_date = (end_date + interval '23 years')::date,
  slug = replace(slug, '-2003-', '-2026-'),
  updated_at = now()
where website like 'https://www.ryegate.com/SHOWS/cal.php%'
  and extract(year from start_date) = 2003;

update public.event_imports
set
  external_id = replace(external_id, '_2003-', '_2026-'),
  start_date = (start_date + interval '23 years')::date,
  end_date = (end_date + interval '23 years')::date,
  updated_at = now()
where source = 'Ryegate Show Services'
  and extract(year from start_date) = 2003;

commit;

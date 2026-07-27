-- Imported Ryegate records originally stored league abbreviations in events.circuit.
-- The public calendar's browse buttons are regional, so normalize existing
-- imported shows to the regional values used by the site.

update public.events
set circuit = case
  when lower(title) like '%championship%'
    or lower(title) like '%final%'
    or lower(title) like '%pony finals%'
    or lower(title) like '%medal final%'
    then 'Championships'
  when upper(trim(state)) = 'KY' then 'Kentucky'
  when upper(trim(state)) in ('CAN', 'CANADA') then 'Canada'
  when upper(trim(state)) in ('CT', 'DC', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VA', 'VT', 'WV')
    then 'Northeast'
  when upper(trim(state)) in ('AL', 'AR', 'FL', 'GA', 'LA', 'MS', 'NC', 'SC', 'TN')
    then 'Southeast'
  when upper(trim(state)) in ('IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'OK', 'SD', 'TX', 'WI')
    then 'Midwest'
  when upper(trim(state)) in ('AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NM', 'NV', 'OR', 'UT', 'WA', 'WY')
    then 'West'
  else circuit
end,
updated_at = now()
where description like 'Show information imported from Ryegate Show Services.%';

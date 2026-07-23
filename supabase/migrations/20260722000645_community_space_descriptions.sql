update public.community_spaces
set description = case slug
  when 'barn-aisle' then 'The practical notes, small wins, and daily things that keep a barn moving.'
  when 'hunter-and-equitation' then 'Rounds, lessons, divisions, and the quiet details that make the picture work.'
  when 'pony-parents' then 'Packing lists, pep talks, growth spurts, and the pony-ring logistics nobody warns you about.'
  when 'buying-selling-and-leasing' then 'Thoughtful perspective for the searches, trials, and hard-to-name feelings in between.'
  when 'horse-show-help' then 'The useful answers for show weeks, from braids to hotel rooms to one more pair of hands.'
  when 'shipping-and-transportation' then 'Travel planning, shipper questions, and helping horses arrive ready to settle in.'
  when 'barn-life' then 'The people, routines, and tiny systems that make a good barn feel like a good barn.'
  when 'jobs-and-working-students' then 'Career questions, work-life reality, and opportunities around the ring.'
  when 'off-topic' then 'The ride-home thoughts and horse-person side conversations that do not fit anywhere else.'
  else description
end
where slug in (
  'barn-aisle',
  'hunter-and-equitation',
  'pony-parents',
  'buying-selling-and-leasing',
  'horse-show-help',
  'shipping-and-transportation',
  'barn-life',
  'jobs-and-working-students',
  'off-topic'
);

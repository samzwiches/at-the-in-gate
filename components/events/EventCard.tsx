import Link from "next/link";
import type { EventCard as EventCardType } from "@/lib/supabase/events";
import { formatEventDates } from "@/lib/supabase/events";

export default function EventCard({ event }: { event: EventCardType }) {
  return (
    <article className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{event.circuit}</p><span className="text-lg text-[#2d4737]" aria-hidden="true">↗</span></div>
      <h3 className="mt-8 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#242721]"><Link href={`/events/show/${event.slug}`} className="transition-colors hover:text-[#7b2430]">{event.title}</Link></h3>
      <p className="mt-4 text-sm font-semibold text-[#2d4737]">{formatEventDates(event.start_date, event.end_date)}</p>
      <p className="mt-2 text-sm text-[#56584f]">{event.venue} · {event.city}, {event.state}</p>
      <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#56584f]">{event.description}</p>
      <Link href={`/events/show/${event.slug}`} className="mt-6 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View event</Link>
    </article>
  );
}

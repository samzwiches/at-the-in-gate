import Link from "next/link";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import { getPublishedEvents } from "@/lib/supabase/events";
import { eventCircuits } from "@/lib/taxonomy";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  const categoryItems = [
    { label: "All events", href: "/events" },
    ...eventCircuits.map((circuit) => ({ label: circuit.label, href: `/events/${circuit.slug}` })),
  ];

  return (
    <PageCanvas appearanceKey="events.page" tone="cream" className="py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="events.hero">
        <header className="max-w-3xl">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">The show circuit</p>
          <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Know where everyone is headed.</h1>
          <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Shows, finals, and clinics submitted by the people organizing the week.</p>
          <Link href="/events/new" className="mt-7 inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#7b2430]">Add an event <span className="ml-2" aria-hidden="true">↗</span></Link>
        </header>
        </PageHero>
        <section className="mt-10 border-y border-[#242721]/20 py-4">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Browse by circuit</p>
          <div className="mt-3"><CategoryNav ariaLabel="Event circuits" items={categoryItems} activeHref="/events" /></div>
        </section>
        <section className="mt-10" aria-labelledby="events-title">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#242721]/20 pb-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">On the calendar</p><h2 id="events-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Dates worth circling.</h2></div><p className="text-sm font-semibold text-[#56584f]">{events.length} {events.length === 1 ? "event" : "events"}</p></div>
          {events.length > 0 ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="mt-6"><EmptyState eyebrow="The calendar is clear" title="No approved events are on the board." description="Organizers can send event details for review, and approved dates will appear here." action={<Link href="/events/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Submit an event <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}
        </section>
      </PageContainer>
    </PageCanvas>
  );
}

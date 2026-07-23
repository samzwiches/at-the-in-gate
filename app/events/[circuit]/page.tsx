import { notFound } from "next/navigation";
import CategoryNav from "@/components/ui/CategoryNav";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import PageContainer from "@/components/layout/PageContainer";
import { getPublishedEventsForCircuit } from "@/lib/supabase/events";
import { eventCircuits, getTaxonomyItem } from "@/lib/taxonomy";

type EventCircuitPageProps = { params: Promise<{ circuit: string }> };

export default async function EventCircuitPage({ params }: EventCircuitPageProps) {
  const { circuit: circuitSlug } = await params;
  const circuit = getTaxonomyItem(eventCircuits, circuitSlug);

  if (!circuit) {
    notFound();
  }

  const events = await getPublishedEventsForCircuit(circuit.label);
  const categoryItems = [{ label: "All events", href: "/events" }, ...eventCircuits.map((item) => ({ label: item.label, href: `/events/${item.slug}` }))];

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-6xl"><Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: circuit.label }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Event circuit</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{circuit.label} dates.</h1></header><div className="mt-6"><CategoryNav ariaLabel="Event circuits" items={categoryItems} activeHref={`/events/${circuit.slug}`} /></div>{events.length > 0 ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="mt-10"><EmptyState eyebrow="No matching dates" title={`No approved ${circuit.label} events are on the board.`} description="Submitted events appear here after review." /></div>}</div></PageContainer></main>
  );
}

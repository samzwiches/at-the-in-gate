import Link from "next/link";
import EventsCalendar from "@/components/events/EventsCalendar";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import { getPublishedEvents } from "@/lib/supabase/events";
import { eventCircuits } from "@/lib/taxonomy";

type EventsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const [events, resolvedSearchParams] = await Promise.all([getPublishedEvents(), searchParams]);
  const timingValue = firstValue(resolvedSearchParams.timing);
  const viewValue = firstValue(resolvedSearchParams.view);
  const monthValue = firstValue(resolvedSearchParams.month);
  const timing = timingValue === "all" || timingValue === "past" ? timingValue : "upcoming";
  const view = viewValue === "cards" ? "cards" : "schedule";
  const month = /^\d{4}-\d{2}$/.test(monthValue) ? monthValue : "all";

  return (
    <PageCanvas appearanceKey="events.page" tone="cream" className="py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="events.hero">
          <header className="max-w-3xl">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">The show circuit</p>
            <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Know where everyone is headed.</h1>
            <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Search approved horse shows by month, state, circuit, venue, or name, then keep the season moving.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#show-calendar" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430]">Browse the schedule</Link>
              <Link href="/events/new" className="inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Submit a show <span className="ml-2" aria-hidden="true">↗</span></Link>
            </div>
          </header>
        </PageHero>

        <EventsCalendar
          events={events}
          circuits={eventCircuits}
          todayDate={new Date().toISOString().slice(0, 10)}
          initialFilters={{
            query: firstValue(resolvedSearchParams.q),
            circuit: firstValue(resolvedSearchParams.circuit) || "all",
            state: firstValue(resolvedSearchParams.state) || "all",
            month,
            timing,
            view,
          }}
        />
      </PageContainer>
    </PageCanvas>
  );
}

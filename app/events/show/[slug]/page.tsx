import Link from "next/link";
import { notFound } from "next/navigation";
import JobCard from "@/components/jobs/JobCard";
import PageContainer from "@/components/layout/PageContainer";
import ListingCard from "@/components/marketplace/ListingCard";
import RelatedEntityCard from "@/components/relationships/RelatedEntityCard";
import ReviewSection from "@/components/reviews/ReviewSection";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getDirectoryEntryById } from "@/lib/supabase/directory";
import { formatEventDates, getEventBySlug } from "@/lib/supabase/events";
import { getPublishedShowCrewJobsForEvent } from "@/lib/supabase/jobs";
import { getRelatedListingsForEvent } from "@/lib/supabase/relationships";
import { getPublishedReviewsForTarget } from "@/lib/supabase/reviews";
import { eventCircuits } from "@/lib/taxonomy";

type EventDetailPageProps = { params: Promise<{ slug: string }> };

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const circuit = eventCircuits.find((item) => item.label === event.circuit);
  const circuitHref = circuit ? `/events/${circuit.slug}` : "/events";
  const [organizer, relatedListings, reviews, showCrewJobs] = await Promise.all([
    event.organizer_directory_entry_id ? getDirectoryEntryById(event.organizer_directory_entry_id) : Promise.resolve(null),
    getRelatedListingsForEvent(event.id),
    getPublishedReviewsForTarget({ type: "event", id: event.id }),
    getPublishedShowCrewJobsForEvent(event.id),
  ]);

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: event.circuit, href: circuitHref }, { label: event.title }]} />
          <article className="mt-8 border border-[#242721]/20 bg-[#f9f5ed] p-6 sm:p-9">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">{event.circuit}</p>
            <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{event.title}</h1>
            <p className="mt-5 text-lg font-semibold text-[#2d4737]">{formatEventDates(event.start_date, event.end_date)}</p>
            <p className="mt-2 text-sm text-[#56584f]">{event.venue} · {event.city}, {event.state}</p>
            <div className="mt-8 border-t border-[#242721]/15 pt-6"><p className="whitespace-pre-wrap text-base leading-8 text-[#50564e]">{event.description}</p></div>
            {event.website || event.contact_details ? <div className="mt-8 grid gap-4 border-t border-[#242721]/15 pt-6 sm:grid-cols-2">{event.website ? <a href={event.website} target="_blank" rel="noreferrer" className="border border-[#2d4737] px-4 py-3 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Event website <span className="ml-2" aria-hidden="true">↗</span></a> : null}{event.contact_details ? <p className="border border-[#242721]/20 px-4 py-3 text-sm leading-6 text-[#56584f]">{event.contact_details}</p> : null}</div> : null}
          </article>

          <section className="mt-8 border border-[#7b2430]/25 bg-[#e7e1d5] p-5 sm:p-7" aria-labelledby="event-show-crew-title">
            <div className="flex flex-col gap-5 border-b border-[#242721]/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Show Crew</p>
                <h2 id="event-show-crew-title" className="mt-2 font-serif text-3xl text-[#242721]">Need help here, or available to work?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#56584f]">Post a dated request for grooming, ring help, setup, night checks, braiding, or another specific job at this show.</p>
              </div>
              <Link href={`/jobs/new?kind=show-crew&event=${event.id}`} className="inline-flex shrink-0 border border-[#7b2430] bg-[#7b2430] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#2d4737]">Post help needed <span className="ml-2" aria-hidden="true">↗</span></Link>
            </div>
            {showCrewJobs.length > 0 ? <div className="mt-6 grid gap-5 sm:grid-cols-2">{showCrewJobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <p className="mt-5 text-sm leading-7 text-[#56584f]">No active Show Crew requests are attached to this event yet.</p>}
          </section>

          {organizer ? <section className="mt-8"><RelatedEntityCard eyebrow="Event organizer" title={organizer.name} detail={`${organizer.city}, ${organizer.state}`} href={`/directory/${organizer.slug}`} /></section> : null}
          {relatedListings.length > 0 ? <section className="mt-10"><div className="border-b border-[#242721]/20 pb-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Marketplace connections</p><h2 className="mt-2 font-serif text-3xl text-[#242721]">Listings linked to this event.</h2></div><div className="mt-5 grid gap-5 sm:grid-cols-2">{relatedListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></section> : null}
          <ReviewSection reviews={reviews} targetType="event" targetId={event.id} targetName={event.title} />
          <Link href={circuitHref} className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to events</Link>
        </div>
      </PageContainer>
    </main>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { InGateComposer, ShowStatusActions } from "@/components/events/ShowHubInteractive";
import JobCard from "@/components/jobs/JobCard";
import PageContainer from "@/components/layout/PageContainer";
import ListingCard from "@/components/marketplace/ListingCard";
import RelatedEntityCard from "@/components/relationships/RelatedEntityCard";
import ReviewSection from "@/components/reviews/ReviewSection";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { getDirectoryEntryById } from "@/lib/supabase/directory";
import { formatEventDates, getEventBySlug } from "@/lib/supabase/events";
import { getPublishedShowCrewJobsForEvent } from "@/lib/supabase/jobs";
import { getRelatedListingsForEvent } from "@/lib/supabase/relationships";
import { getPublishedReviewsForTarget } from "@/lib/supabase/reviews";
import { getPublishedEventUpdates, getShowHubStats, getViewerEventStatus } from "@/lib/supabase/show-hub";
import { eventCircuits } from "@/lib/taxonomy";

type EventDetailPageProps = { params: Promise<{ slug: string }> };

const updateTypeLabels = {
  general: "Around the show",
  ring: "Ring update",
  shipping: "Shipping",
  horse: "Horse to try",
  help: "Help needed",
  vendor: "Vendor / service",
} as const;

function formatUpdateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#242721]/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721] sm:text-4xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#56584f]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const circuit = eventCircuits.find((item) => item.label === event.circuit);
  const circuitHref = circuit ? `/events/${circuit.slug}` : "/events";
  const viewer = await getAuthenticatedUser();

  const [organizer, relatedListings, reviews, showCrewJobs, stats, viewerStatus, updates] = await Promise.all([
    event.organizer_directory_entry_id ? getDirectoryEntryById(event.organizer_directory_entry_id) : Promise.resolve(null),
    getRelatedListingsForEvent(event.id),
    getPublishedReviewsForTarget({ type: "event", id: event.id }),
    getPublishedShowCrewJobsForEvent(event.id),
    getShowHubStats(event.id),
    getViewerEventStatus(event.id, viewer?.id ?? null),
    getPublishedEventUpdates(event.id),
  ]);

  return (
    <main className="bg-[#f4efe5] py-8 sm:py-12">
      <PageContainer>
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: event.circuit, href: circuitHref }, { label: event.title }]} />

          <header className="mt-7 border border-[#242721]/20 bg-[#f9f5ed]">
            <div className="p-6 sm:p-9 lg:p-11">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#7b2430]">{event.circuit} · Show Hub</p>
                  <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.05em] text-[#242721] sm:text-6xl lg:text-7xl">{event.title}</h1>
                  <p className="mt-6 text-lg font-semibold text-[#2d4737]">{formatEventDates(event.start_date, event.end_date)}</p>
                  <p className="mt-2 text-sm text-[#56584f]">{event.venue} · {event.city}, {event.state}</p>
                </div>
                <ShowStatusActions eventId={event.id} eventSlug={event.slug} status={viewerStatus} />
              </div>

              <div className="mt-8 grid grid-cols-2 border-y border-[#242721]/15 sm:grid-cols-4">
                <div className="border-r border-[#242721]/15 px-3 py-4 sm:px-5">
                  <p className="font-serif text-3xl text-[#242721]">{stats.goingCount}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#686a61]">Going</p>
                </div>
                <div className="border-r border-[#242721]/15 px-3 py-4 sm:px-5">
                  <p className="font-serif text-3xl text-[#242721]">{stats.followingCount}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#686a61]">Following</p>
                </div>
                <div className="border-r border-[#242721]/15 px-3 py-4 sm:px-5">
                  <p className="font-serif text-3xl text-[#242721]">{relatedListings.length}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#686a61]">Horses here</p>
                </div>
                <div className="px-3 py-4 sm:px-5">
                  <p className="font-serif text-3xl text-[#242721]">{stats.updateCount}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#686a61]">In Gate updates</p>
                </div>
              </div>

              <p className="mt-7 max-w-3xl whitespace-pre-wrap text-base leading-8 text-[#50564e]">{event.description}</p>
              {event.website || event.contact_details ? (
                <div className="mt-7 flex flex-wrap gap-3">
                  {event.website ? <a href={event.website} target="_blank" rel="noreferrer" className="border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]">Official show website ↗</a> : null}
                  {event.contact_details ? <span className="text-sm text-[#56584f]">{event.contact_details}</span> : null}
                </div>
              ) : null}
            </div>

            <nav aria-label="Show sections" className="overflow-x-auto border-t border-[#242721]/20 bg-[#e7e1d5]">
              <div className="flex min-w-max">
                {[
                  ["Overview", "#overview"],
                  ["In Gate", "#in-gate"],
                  ["Horses", "#horses"],
                  ["People", "#people"],
                  ["Services", "#services"],
                  ["Jobs", "#jobs"],
                ].map(([label, href]) => (
                  <a key={href} href={href} className="border-r border-[#242721]/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#2d4737] transition-colors hover:bg-[#2d4737] hover:text-[#f9f5ed]">{label}</a>
                ))}
              </div>
            </nav>
          </header>

          <section id="overview" className="mt-10 scroll-mt-6">
            <SectionHeading eyebrow="At this show" title="Everything around this week, connected." description="The practical layer around the show: conversation, horses to try, people, services, and work." />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <a href="#in-gate" className="border border-[#242721]/20 bg-[#e7e1d5] p-5 transition-colors hover:border-[#7b2430]">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b2430]">Live board</p>
                <p className="mt-4 font-serif text-3xl text-[#242721]">At The In Gate</p>
                <p className="mt-3 text-sm leading-6 text-[#56584f]">Ring notes, shipping, horses to try, help needed, and useful show-week updates.</p>
              </a>
              <a href="#horses" className="border border-[#242721]/20 bg-[#f9f5ed] p-5 transition-colors hover:border-[#7b2430]">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b2430]">Marketplace</p>
                <p className="mt-4 font-serif text-3xl text-[#242721]">{relatedListings.length} {relatedListings.length === 1 ? "horse" : "horses"}</p>
                <p className="mt-3 text-sm leading-6 text-[#56584f]">Listings connected to this show so buyers know what can be seen or tried here.</p>
              </a>
              <a href="#jobs" className="border border-[#242721]/20 bg-[#f9f5ed] p-5 transition-colors hover:border-[#7b2430]">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b2430]">Show Crew</p>
                <p className="mt-4 font-serif text-3xl text-[#242721]">{showCrewJobs.length} open</p>
                <p className="mt-3 text-sm leading-6 text-[#56584f]">Grooms, braiders, ring help, night checks, setup, and other show-specific work.</p>
              </a>
            </div>
          </section>

          <section id="in-gate" className="mt-12 scroll-mt-6 border border-[#7b2430]/25 bg-[#e7e1d5] p-5 sm:p-7">
            <SectionHeading eyebrow="Live from the grounds" title="At The In Gate" description="The things people usually text the group chat—now attached to the show where they are actually useful." />
            <div className="mt-6">
              <InGateComposer eventId={event.id} eventSlug={event.slug} />
            </div>
            {updates.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {updates.map((update) => (
                  <article key={update.id} className="border border-[#242721]/15 bg-[#fffdf8] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{updateTypeLabels[update.update_type]}</span>
                      <span className="text-xs text-[#74766e]">{formatUpdateTime(update.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#363a35]">{update.body}</p>
                    <p className="mt-3 text-xs font-semibold text-[#2d4737]">From {update.authorName}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 border border-dashed border-[#2d4737]/35 bg-[#f4efe5] p-5">
                <p className="font-serif text-2xl text-[#242721]">Nothing has been passed down the aisle yet.</p>
                <p className="mt-2 text-sm leading-6 text-[#56584f]">Be the first to share a useful ring update, shipping spot, horse to try, service note, or request for help.</p>
              </div>
            )}
          </section>

          <section id="horses" className="mt-12 scroll-mt-6">
            <SectionHeading
              eyebrow="Horses at this show"
              title="Available to see or try."
              description="Marketplace listings linked to this show become part of the show-week experience instead of living in a separate silo."
              action={<Link href="/marketplace/new" className="inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] hover:bg-[#2d4737] hover:text-[#f9f5ed]">List a horse</Link>}
            />
            {relatedListings.length > 0 ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relatedListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
            ) : (
              <div className="mt-5 border border-dashed border-[#242721]/30 bg-[#f9f5ed] p-6">
                <p className="font-serif text-2xl text-[#242721]">No horses are linked to this show yet.</p>
                <p className="mt-2 text-sm leading-6 text-[#56584f]">Sellers can connect a marketplace listing to the show so riders know the horse is available to see here.</p>
              </div>
            )}
          </section>

          <section id="people" className="mt-12 scroll-mt-6">
            <SectionHeading eyebrow="Who's here" title="People and organizations around the show." description="This section is the beginning of the network layer: organizers today, followed by attending professionals, barns, and members." />
            {organizer ? (
              <div className="mt-5 max-w-2xl"><RelatedEntityCard eyebrow="Event organizer" title={organizer.name} detail={`${organizer.city}, ${organizer.state}`} href={`/directory/${organizer.slug}`} /></div>
            ) : (
              <div className="mt-5 border border-dashed border-[#242721]/30 bg-[#f9f5ed] p-6 text-sm leading-6 text-[#56584f]">No organizer profile is connected yet. Attendance is already tracked above; professional attendance can build on the same show relationship next.</div>
            )}
          </section>

          <section id="services" className="mt-12 scroll-mt-6">
            <SectionHeading eyebrow="Around the show" title="Shipping, vendors, and services." description="Service discovery belongs in context—who can help at this show, this week—not buried in a generic directory." />
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                ["Shipping", "Post an open route, a box stall, or a ride needed.", "shipping"],
                ["Vendors & services", "Photographers, braiders, body workers, tack, and other show-week services.", "vendor"],
                ["Help needed", "Small practical requests that do not need a full job posting.", "help"],
              ].map(([title, description, type]) => (
                <a key={title} href="#in-gate" className="border border-[#242721]/20 bg-[#f9f5ed] p-5 transition-colors hover:border-[#7b2430]">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b2430]">{type}</p>
                  <h3 className="mt-3 font-serif text-2xl text-[#242721]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#56584f]">{description}</p>
                  <p className="mt-4 text-xs font-bold text-[#2d4737]">Post at the In Gate ↑</p>
                </a>
              ))}
            </div>
          </section>

          <section id="jobs" className="mt-12 scroll-mt-6">
            <SectionHeading
              eyebrow="Show Crew"
              title="Need help here, or available to work?"
              description="Dated requests for grooming, ring help, setup, night checks, braiding, and other specific jobs at this show."
              action={<Link href={`/jobs/new?kind=show-crew&event=${event.id}`} className="inline-flex border border-[#7b2430] bg-[#7b2430] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#2d4737]">Post help needed ↗</Link>}
            />
            {showCrewJobs.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{showCrewJobs.map((job) => <JobCard key={job.id} job={job} />)}</div>
            ) : (
              <div className="mt-5 border border-dashed border-[#242721]/30 bg-[#f9f5ed] p-6">
                <p className="font-serif text-2xl text-[#242721]">No active Show Crew requests yet.</p>
                <p className="mt-2 text-sm leading-6 text-[#56584f]">When someone needs show-week help, the posting will appear here and stay attached to the event.</p>
              </div>
            )}
          </section>

          <section className="mt-12">
            <ReviewSection reviews={reviews} targetType="event" targetId={event.id} targetName={event.title} />
          </section>

          <Link href={circuitHref} className="mt-10 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">← Back to {event.circuit}</Link>
        </div>
      </PageContainer>
    </main>
  );
}

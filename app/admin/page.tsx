import Link from "next/link";
import type { ReactNode } from "react";
import EventImportControls from "@/components/admin/EventImportControls";
import ModerationControls from "@/components/admin/ModerationControls";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { requireAdministrator } from "@/lib/membership/require-active-membership";
import { getDirectoryEntriesForModeration } from "@/lib/supabase/directory";
import { getEventImportsForModeration } from "@/lib/supabase/event-imports";
import { getReviewsForModeration, reviewTargetFromRow } from "@/lib/supabase/reviews";
import { getServiceOfferingsForModeration } from "@/lib/supabase/services";
import { getShippingRoutesForModeration } from "@/lib/supabase/shipping";
import { getShopItemsForModeration } from "@/lib/supabase/shop";
import {
  getTaxonomyItem,
  directoryCategories,
  serviceCategories,
  shopCategories,
} from "@/lib/taxonomy";
import { reviewTargetLabel } from "@/lib/relationships";

function pendingCount(items: { moderation_status: string }[]) {
  return items.filter((item) => item.moderation_status === "pending").length;
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const start = formatter.format(new Date(`${startDate}T12:00:00Z`));
  const end = formatter.format(new Date(`${endDate}T12:00:00Z`));
  return startDate === endDate ? start : `${start} to ${end}`;
}

export default async function AdminPage() {
  await requireAdministrator("/admin");
  const [directoryEntries, eventImports, shopItems, services, routes, reviews] =
    await Promise.all([
      getDirectoryEntriesForModeration(),
      getEventImportsForModeration(),
      getShopItemsForModeration(),
      getServiceOfferingsForModeration(),
      getShippingRoutesForModeration(),
      getReviewsForModeration(),
    ]);

  const importedShowsWaiting = eventImports.filter((item) =>
    ["new", "reviewing"].includes(item.import_status)
  ).length;
  const deskNotes = [
    ["Imported show review", String(importedShowsWaiting), "Ryegate dates waiting for publication"],
    ["Directory review", String(pendingCount(directoryEntries)), "People, programs, and services waiting for a clear read"],
    ["Service and route review", String(pendingCount(services) + pendingCount(routes)), "Offerings and travel notes on the desk"],
    ["Review moderation", String(pendingCount(reviews)), "Community references waiting for a fair look"],
  ];

  return (
    <main className="bg-[#e7e1d5] py-12 sm:py-16">
      <PageContainer>
        <p className="border border-[#b08d57] bg-[#f9f5ed] px-4 py-3 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">
          Administrator desk · Live moderation
        </p>

        <header className="mt-8 border-b border-[#242721]/20 pb-8">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">
            The in-gate desk
          </p>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">
            Keep the board useful.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#56584f]">
            Review imported show dates and community submissions, then decide what belongs on the public board.
          </p>
        </header>

        <section className="mt-8 border-y border-[#242721]/20">
          <div className="grid divide-y divide-[#242721]/15 md:grid-cols-4 md:divide-x md:divide-y-0">
            {deskNotes.map(([label, count, detail]) => (
              <article key={label} className="bg-[#f9f5ed] p-5">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.15em] text-[#7b2430]">
                  {label}
                </p>
                <p className="mt-4 font-serif text-4xl text-[#2d4737]">{count}</p>
                <p className="mt-2 text-sm leading-5 text-[#686a61]">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 border border-[#2d4737] bg-[#2d4737] p-5 text-[#f9f4eb] sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">
              Site appearance
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.025em]">The picture desk.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e2ddcf]">
              Replace approved hero, section, and footer images without disturbing page layouts.
            </p>
          </div>
          <Link
            href="/admin/site-media"
            className="mt-5 inline-flex shrink-0 border border-[#f9f4eb] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] hover:border-[#d8bd85] hover:text-[#d8bd85] sm:mt-0"
          >
            Manage site media <span className="ml-2" aria-hidden="true">↗</span>
          </Link>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="border border-[#242721]/20 bg-[#f9f5ed] xl:col-span-2">
            <QueueHeading eyebrow="Ryegate import queue" title="Shows waiting at the gate." href="/events" label="View calendar" />
            {eventImports.length ? (
              <div>
                {eventImports.map((item) => {
                  const location = [item.city, item.state].filter(Boolean).join(", ") || "Location not supplied";
                  const details = [
                    formatDateRange(item.start_date, item.end_date),
                    location,
                    item.zone ? `Zone ${item.zone}` : null,
                    item.affiliations.length ? item.affiliations.join(", ") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <article key={item.id} className="border-b border-[#242721]/12 p-5 last:border-b-0">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">
                            {item.import_status} · {item.source}
                          </p>
                          <h3 className="mt-2 font-serif text-2xl text-[#242721]">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-[#686a61]">{details}</p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2d4737] hover:text-[#7b2430]"
                            >
                              Open Ryegate source ↗
                            </a>
                            {item.contact_name || item.contact_phone ? (
                              <span className="font-normal text-[#686a61]">
                                {[item.contact_name, item.contact_phone].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <EventImportControls recordId={item.id} status={item.import_status} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                eyebrow="No imported shows"
                title="The Ryegate queue is empty."
                description="Run the importer and its show records will arrive here for review."
              />
            )}
          </section>

          <section className="border border-[#242721]/20 bg-[#f9f5ed]">
            <QueueHeading eyebrow="Directory queue" title="People and programs." href="/directory" label="View directory" />
            {directoryEntries.length ? (
              <div>
                {directoryEntries.map((entry) => {
                  const category = getTaxonomyItem(directoryCategories, entry.category);
                  return (
                    <QueueRow
                      key={entry.id}
                      eyebrow={`${entry.moderation_status} · ${category?.label ?? entry.category}`}
                      title={entry.name}
                      detail={`${entry.city}, ${entry.state}`}
                      href={`/directory/${entry.slug}`}
                      controls={<ModerationControls recordId={entry.id} status={entry.moderation_status} target="directory" />}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState eyebrow="No directory entries" title="Nothing is waiting at the desk." description="Directory submissions appear here when members send them for review." />
            )}
          </section>

          <section className="border border-[#242721]/20 bg-[#f9f5ed]">
            <QueueHeading eyebrow="Shop queue" title="Resources and goods." href="/shop" label="View shop" />
            {shopItems.length ? (
              <div>
                {shopItems.map((item) => {
                  const category = getTaxonomyItem(shopCategories, item.category);
                  return (
                    <QueueRow
                      key={item.id}
                      eyebrow={`${item.moderation_status} · ${category?.label ?? item.category}`}
                      title={item.title}
                      detail={item.seller_name}
                      href={`/shop/${item.slug}`}
                      controls={<ModerationControls recordId={item.id} status={item.moderation_status} target="shop" />}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState eyebrow="No shop items" title="No external seller links are waiting." description="Shop submissions appear here when members send them for review." />
            )}
          </section>

          <section className="border border-[#242721]/20 bg-[#f9f5ed]">
            <QueueHeading eyebrow="Service queue" title="Specific offerings." href="/services" label="View services" />
            {services.length ? (
              <div>
                {services.map((service) => {
                  const category = getTaxonomyItem(serviceCategories, service.category);
                  return (
                    <QueueRow
                      key={service.id}
                      eyebrow={`${service.moderation_status} · ${category?.label ?? service.category}`}
                      title={service.title}
                      detail="Attached to a directory identity"
                      href={`/services/${service.slug}`}
                      controls={<ModerationControls recordId={service.id} status={service.moderation_status} target="service" />}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState eyebrow="No services" title="No service offerings are waiting." description="New offerings arrive here after a provider sends them for review." />
            )}
          </section>

          <section className="border border-[#242721]/20 bg-[#f9f5ed]">
            <QueueHeading eyebrow="Shipping queue" title="Routes on the board." href="/shippers" label="View routes" />
            {routes.length ? (
              <div>
                {routes.map((route) => (
                  <QueueRow
                    key={route.id}
                    eyebrow={route.moderation_status}
                    title={route.title}
                    detail="Attached to a shipper directory listing"
                    href={`/shippers/${route.slug}`}
                    controls={<ModerationControls recordId={route.id} status={route.moderation_status} target="shipping" />}
                  />
                ))}
              </div>
            ) : (
              <EmptyState eyebrow="No routes" title="No shipping routes are waiting." description="New route submissions appear here when shipper listings send them for review." />
            )}
          </section>

          <section className="border border-[#242721]/20 bg-[#f9f5ed] xl:col-span-2">
            <QueueHeading eyebrow="Review queue" title="References and context." href="/reviews" label="View reviews" />
            {reviews.length ? (
              <div>
                {reviews.map((review) => {
                  const target = reviewTargetFromRow(review);
                  return (
                    <QueueRow
                      key={review.id}
                      eyebrow={`${review.deleted_at ? "archived" : review.moderation_status} · ${target ? reviewTargetLabel(target.type) : "record"}`}
                      title={review.title ?? `${review.rating}-star review`}
                      detail={review.body}
                      controls={<ModerationControls recordId={review.id} status={review.moderation_status} target="review" />}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState eyebrow="No reviews" title="No reviews are waiting." description="Submitted reviews appear here before public publication." />
            )}
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

function QueueHeading({
  eyebrow,
  title,
  href,
  label,
}: {
  eyebrow: string;
  title: string;
  href: string;
  label: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-[#242721]/15 p-5">
      <div>
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl tracking-[-0.025em] text-[#242721]">{title}</h2>
      </div>
      <Link href={href} className="text-sm font-bold text-[#2d4737] hover:text-[#7b2430]">
        {label}
      </Link>
    </div>
  );
}

function QueueRow({
  eyebrow,
  title,
  detail,
  href,
  controls,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  href?: string;
  controls: ReactNode;
}) {
  return (
    <article className="border-b border-[#242721]/12 p-5 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{eyebrow}</p>
          {href ? (
            <h3 className="mt-2 font-serif text-2xl text-[#242721]">
              <Link href={href} className="hover:text-[#7b2430]">{title}</Link>
            </h3>
          ) : (
            <h3 className="mt-2 font-serif text-2xl text-[#242721]">{title}</h3>
          )}
          <p className="mt-1 line-clamp-2 text-sm text-[#686a61]">{detail}</p>
        </div>
        {controls}
      </div>
    </article>
  );
}

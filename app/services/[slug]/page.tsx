import Link from "next/link";
import { notFound } from "next/navigation";
import ListingCard from "@/components/marketplace/ListingCard";
import RelatedEntityCard from "@/components/relationships/RelatedEntityCard";
import ReviewSection from "@/components/reviews/ReviewSection";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { getDirectoryEntryById } from "@/lib/supabase/directory";
import { getRelatedListingsForDirectoryEntry } from "@/lib/supabase/relationships";
import { getPublishedReviewsForTarget } from "@/lib/supabase/reviews";
import { getServiceOfferingBySlug, serviceCategoryLabel } from "@/lib/supabase/services";

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceOfferingBySlug(slug);
  if (!service) notFound();
  const [directoryEntry, relatedListings, reviews] = await Promise.all([getDirectoryEntryById(service.directory_entry_id), getRelatedListingsForDirectoryEntry(service.directory_entry_id), getPublishedReviewsForTarget({ type: "service_offering", id: service.id })]);
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-5xl"><Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: service.title }]} /><article className="mt-8 border border-[#242721]/20 bg-[#f9f5ed] p-6 sm:p-9"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">{serviceCategoryLabel(service.category)}</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{service.title}</h1>{directoryEntry ? <p className="mt-4 text-lg font-semibold text-[#2d4737]">Offered by <Link href={`/directory/${directoryEntry.slug}`} className="border-b border-[#2d4737] hover:text-[#7b2430]">{directoryEntry.name}</Link></p> : null}{service.service_area ? <p className="mt-2 text-sm text-[#686a61]">{service.service_area}</p> : null}<p className="mt-8 whitespace-pre-wrap text-base leading-8 text-[#50564e]">{service.description}</p>{service.website ? <a href={service.website} target="_blank" rel="noreferrer" className="mt-7 inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]">Visit service website <span className="ml-2" aria-hidden="true">↗</span></a> : null}</article>{directoryEntry ? <section className="mt-8"><RelatedEntityCard eyebrow="Directory identity" title={directoryEntry.name} detail={`${directoryEntry.city}, ${directoryEntry.state}`} href={`/directory/${directoryEntry.slug}`} /></section> : null}{relatedListings.length > 0 ? <section className="mt-10"><div className="border-b border-[#242721]/20 pb-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Related market board</p><h2 className="mt-2 font-serif text-3xl text-[#242721]">Listings linked to this provider.</h2></div><div className="mt-5 grid gap-5 md:grid-cols-2">{relatedListings.map(({ listing }) => <ListingCard key={listing.id} listing={listing} />)}</div></section> : null}<ReviewSection reviews={reviews} targetType="service_offering" targetId={service.id} targetName={service.title} /><Link href="/services" className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Back to services</Link></div></PageContainer></main>;
}

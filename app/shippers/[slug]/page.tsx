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
import { getShippingRouteBySlug } from "@/lib/supabase/shipping";

export default async function ShippingRouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = await getShippingRouteBySlug(slug);
  if (!route) notFound();
  const [shipper, relatedListings, reviews] = await Promise.all([getDirectoryEntryById(route.directory_entry_id), getRelatedListingsForDirectoryEntry(route.directory_entry_id), getPublishedReviewsForTarget({ type: "shipping_route", id: route.id })]);
  return <main className="bg-[#eef1ed] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-5xl"><Breadcrumbs items={[{ label: "Shippers", href: "/shippers" }, { label: route.title }]} /><article className="mt-8 border border-[#242721]/20 bg-[#f9f5ed] p-6 sm:p-9"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Shipping route</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{route.title}</h1>{shipper ? <p className="mt-4 text-lg font-semibold text-[#2d4737]">Run by <Link href={`/directory/${shipper.slug}`} className="border-b border-[#2d4737] hover:text-[#7b2430]">{shipper.name}</Link></p> : null}<div className="mt-8 grid gap-px border border-[#242721]/15 sm:grid-cols-2"><div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Origin</p><p className="mt-2 text-sm text-[#50564e]">{route.origin}</p></div><div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Destination</p><p className="mt-2 text-sm text-[#50564e]">{route.destination}</p></div></div>{route.availability_note ? <p className="mt-5 border-l-2 border-[#b08d57] pl-3 text-sm leading-6 text-[#56584f]">{route.availability_note}</p> : null}<p className="mt-8 whitespace-pre-wrap text-base leading-8 text-[#50564e]">{route.description}</p></article>{shipper ? <section className="mt-8"><RelatedEntityCard eyebrow="Shipper directory listing" title={shipper.name} detail={`${shipper.city}, ${shipper.state}`} href={`/directory/${shipper.slug}`} /></section> : null}{relatedListings.length > 0 ? <section className="mt-10"><div className="border-b border-[#242721]/20 pb-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Related market board</p><h2 className="mt-2 font-serif text-3xl text-[#242721]">Listings linked to this shipper.</h2></div><div className="mt-5 grid gap-5 md:grid-cols-2">{relatedListings.map(({ listing }) => <ListingCard key={listing.id} listing={listing} />)}</div></section> : null}<ReviewSection reviews={reviews} targetType="shipping_route" targetId={route.id} targetName={route.title} /><Link href="/shippers" className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Back to shipping routes</Link></div></PageContainer></main>;
}

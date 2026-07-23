import Link from "next/link";
import { notFound } from "next/navigation";
import ListingForm from "@/components/marketplace/ListingForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getListingBySlug, getListingImages, getListingVideos } from "@/lib/supabase/listings";
import { getListingRelationshipSelection, getPublishedRelationshipPickerData } from "@/lib/supabase/relationships";

type EditListingPageProps = { params: Promise<{ slug: string }> };

type EditListingSearchParams = { photoRequired?: string | string[] };

export default async function EditListingPage({ params, searchParams }: EditListingPageProps & { searchParams: Promise<EditListingSearchParams> }) {
  const { slug } = await params;
  const user = await requireUser(`/marketplace/${slug}/edit`);
  const { photoRequired } = await searchParams;
  const listing = await getListingBySlug(slug);

  if (!listing || listing.owner_id !== user.id || listing.status === "archived") {
    notFound();
  }

  const [images, videos, relationshipOptions, relationships] = await Promise.all([getListingImages(listing.id), getListingVideos(listing.id), getPublishedRelationshipPickerData(), getListingRelationshipSelection(listing.id)]);

  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: listing.horse_name, href: `/marketplace/${listing.slug}` }, { label: "Edit" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Edit listing</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Keep the useful details current.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Changes sent for review return the listing to the moderation queue. Save a draft if you are still working through the details.</p>{photoRequired ? <p className="mt-4 border-l-2 border-[#7b2430] pl-3 text-sm font-semibold leading-6 text-[#7b2430]">Add at least one photo, then send this listing for review.</p> : null}</header><ListingForm listing={listing} images={images} videos={videos} directoryEntries={relationshipOptions.directoryEntries} events={relationshipOptions.events} relationships={relationships} /><Link href={`/marketplace/${listing.slug}`} className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to listing</Link></div></PageContainer></main>;
}

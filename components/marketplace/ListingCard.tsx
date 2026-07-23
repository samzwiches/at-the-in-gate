import Link from "next/link";
import ListingPhoto from "@/components/marketplace/ListingPhoto";
import type { ListingCard as ListingCardType } from "@/lib/supabase/listings";
import { formatListingType, listingDetails } from "@/lib/supabase/listings";

export default function ListingCard({ listing }: { listing: ListingCardType }) {
  const mark = listing.horse_name.slice(0, 2).toUpperCase();
  const image = listing.primaryImage;

  return (
    <article className="relative border border-[#242721]/20 bg-[#f9f5ed]">
      <div className="relative flex aspect-[1.12] items-end overflow-hidden bg-[#899e95] p-5">
        {image?.signedUrl ? <><ListingPhoto src={image.signedUrl} alt={image.alt_text ?? `Portrait of ${listing.horse_name}`} focalX={image.focal_x} focalY={image.focal_y} /><span className="absolute inset-0 bg-[#2d4737]/20" aria-hidden="true" /></> : <span className="relative font-serif text-6xl tracking-[-0.07em] text-[#f9f5ed]/90">{mark}</span>}
        <span className="absolute left-5 top-5 border border-[#f9f5ed]/70 px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.15em] text-[#f9f5ed]">{formatListingType(listing.listing_type)}</span>
        <span className="absolute inset-4 border border-[#f9f5ed]/45" aria-hidden="true" />
      </div>
      <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-2xl tracking-[-0.025em] text-[#242721]">{listing.horse_name}</h3><p className="mt-1 text-xs leading-5 text-[#686a61]">{listingDetails(listing)}</p></div><span className="text-sm font-bold text-[#2d4737]">{listing.price_text}</span></div><div className="mt-5 border-t border-[#242721]/15 pt-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#7b2430]">{listing.division}</p><p className="mt-1 text-xs text-[#686a61]">{listing.location}</p></div><Link href={`/marketplace/${listing.slug}`} className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View listing <span className="ml-2" aria-hidden="true">↗</span></Link></div>
    </article>
  );
}

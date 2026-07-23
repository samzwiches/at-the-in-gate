import Link from "next/link";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import ListingCard from "@/components/marketplace/ListingCard";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import { getPublishedListings } from "@/lib/supabase/listings";
import { listingCategories, listingTypes } from "@/lib/taxonomy";

const divisions = [
  { slug: "hunters", label: "Hunters" },
  { slug: "jumpers", label: "Jumpers" },
  { slug: "equitation", label: "Equitation" },
  { slug: "ponies", label: "Ponies" },
];

type MarketplacePageProps = {
  searchParams: Promise<{ division?: string | string[]; type?: string | string[] }>;
};

function oneValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const { division: divisionValue, type: listingTypeValue } = await searchParams;
  const division = oneValue(divisionValue);
  const listingType = oneValue(listingTypeValue);
  const listings = await getPublishedListings({ division, listingType });
  const categoryItems = [{ label: "All listings", href: "/marketplace" }, ...listingCategories.map((category) => ({ label: category.label, href: `/marketplace/category/${category.slug}` }))];
  const filterItems = [{ label: "All divisions", href: "/marketplace" }, ...divisions.map((item) => ({ label: item.label, href: `/marketplace?division=${item.slug}` }))];
  const typeItems = [{ label: "Any terms", href: division ? `/marketplace?division=${division}` : "/marketplace" }, ...listingTypes.map((item) => ({ label: item.label, href: `${division ? `/marketplace?division=${division}&` : "/marketplace?"}type=${item.slug.replaceAll("-", "_")}` }))];
  const activeDivisionHref = division ? `/marketplace?division=${division}` : "/marketplace";
  const activeTypeHref = listingType ? `${division ? `/marketplace?division=${division}&` : "/marketplace?"}type=${listingType}` : (division ? `/marketplace?division=${division}` : "/marketplace");

  return <PageCanvas appearanceKey="marketplace.page" tone="cream" className="py-12 sm:py-16"><PageContainer><PageHero mediaKey="marketplace.hero"><header className="max-w-3xl"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">The market board</p><h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Find the one worth looking twice at.</h1><p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Published listings with the useful details up front.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/marketplace/new" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#7b2430]">Add a listing <span className="ml-2" aria-hidden="true">↗</span></Link><Link href="/marketplace/my-listings" className="inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">My listings</Link></div></header></PageHero><section className="mt-10 border-y border-[#242721]/20 py-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Browse categories</p><div className="mt-3"><CategoryNav ariaLabel="Marketplace categories" items={categoryItems} activeHref="/marketplace" /></div></section><section className="mt-7 border-b border-[#242721]/20 pb-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Narrow the board</p><div className="mt-3 grid gap-4 lg:grid-cols-2"><CategoryNav ariaLabel="Listing divisions" items={filterItems} activeHref={activeDivisionHref} /><CategoryNav ariaLabel="Listing terms" items={typeItems} activeHref={activeTypeHref} /></div></section><section className="mt-10" aria-labelledby="marketplace-listings-title"><div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">On the board</p><h2 id="marketplace-listings-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Current listings.</h2></div><p className="text-sm font-semibold text-[#56584f]">{listings.length} {listings.length === 1 ? "listing" : "listings"}</p></div>{listings.length > 0 ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="mt-6"><EmptyState eyebrow="No matching listings" title="Nothing on the board meets those filters." description="Clear a filter or check another category." action={<Link href="/marketplace" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Clear filters</Link>} /></div>}</section></PageContainer></PageCanvas>;
}

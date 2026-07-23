import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import ListingCard from "@/components/marketplace/ListingCard";
import PageContainer from "@/components/layout/PageContainer";
import { getPublishedListings } from "@/lib/supabase/listings";
import { getTaxonomyItem, listingCategories } from "@/lib/taxonomy";

type MarketplaceCategoryPageProps = { params: Promise<{ categorySlug: string }> };

export default async function MarketplaceCategoryPage({ params }: MarketplaceCategoryPageProps) {
  const { categorySlug } = await params;
  const category = getTaxonomyItem(listingCategories, categorySlug);
  if (!category) notFound();
  const listings = await getPublishedListings({ category: category.slug });
  const categoryItems = [{ label: "All listings", href: "/marketplace" }, ...listingCategories.map((item) => ({ label: item.label, href: `/marketplace/category/${item.slug}` }))];
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-6xl"><Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: category.label }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Marketplace category</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{category.label}.</h1></header><div className="mt-6"><CategoryNav ariaLabel="Marketplace categories" items={categoryItems} activeHref={`/marketplace/category/${category.slug}`} /></div>{listings.length > 0 ? <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="mt-10"><EmptyState eyebrow="The board is clear" title={`No published ${category.label.toLowerCase()} are listed.`} description="New listings appear here after they are approved." /></div>}</div></PageContainer></main>;
}

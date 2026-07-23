import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryNav from "@/components/ui/CategoryNav";
import ShopItemCard from "@/components/shop/ShopItemCard";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { getPublishedShopItemsForCategory } from "@/lib/supabase/shop";
import { getTaxonomyItem, shopCategories } from "@/lib/taxonomy";

type ShopCategoryPageProps = { params: Promise<{ categorySlug: string }> };

export default async function ShopCategoryPage({ params }: ShopCategoryPageProps) {
  const { categorySlug } = await params;
  const category = getTaxonomyItem(shopCategories, categorySlug);
  if (!category) notFound();
  const items = await getPublishedShopItemsForCategory(category.slug);
  const categoryItems = [{ label: "All", href: "/shop" }, ...shopCategories.map((item) => ({ label: item.label, href: `/shop/category/${item.slug}` }))];
  return <main className="bg-[#e7e1d5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-6xl"><Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: category.label }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Shop category</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{category.label}.</h1></header><div className="mt-6"><CategoryNav ariaLabel="Shop categories" items={categoryItems} activeHref={`/shop/category/${category.slug}`} /></div>{items.length > 0 ? <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <ShopItemCard key={item.id} item={item} />)}</div> : <div className="mt-10"><EmptyState eyebrow="No matching items" title={`No approved ${category.label.toLowerCase()} are listed.`} description="Approved items in this category will appear here." /></div>}</div></PageContainer></main>;
}

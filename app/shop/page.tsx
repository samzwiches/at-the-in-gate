import Link from "next/link";
import ShopItemCard from "@/components/shop/ShopItemCard";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import { getPublishedShopItems } from "@/lib/supabase/shop";
import { shopCategories } from "@/lib/taxonomy";

export default async function ShopPage() {
  const items = await getPublishedShopItems();
  const categoryItems = [{ label: "All", href: "/shop" }, ...shopCategories.map((category) => ({ label: category.label, href: `/shop/category/${category.slug}` }))];

  return (
    <PageCanvas appearanceKey="shop.page" tone="shop" className="py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="shop.hero">
          <header className="flex flex-col gap-7 border-b border-[#242721]/20 pb-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">The tack trunk</p>
              <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Useful things for the horse-world life.</h1>
              <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">A curated board of resources and goods that send you directly to the seller when you are ready.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop/new" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#7b2430]">Add a shop item <span className="ml-2" aria-hidden="true">↗</span></Link>
              <Link href="/shop/mine" className="inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Manage my items</Link>
            </div>
          </header>
        </PageHero>

        <section className="mt-7 border-y border-[#242721]/20 py-4">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Browse the collection</p>
          <div className="mt-3"><CategoryNav ariaLabel="Shop categories" items={categoryItems} activeHref="/shop" /></div>
        </section>

        <section className="mt-10" aria-labelledby="shop-items-title">
          <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4">
            <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Approved items</p><h2 id="shop-items-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">The current edit.</h2></div>
            <p className="text-sm font-semibold text-[#56584f]">{items.length} {items.length === 1 ? "item" : "items"}</p>
          </div>
          {items.length > 0 ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <ShopItemCard key={item.id} item={item} />)}</div> : <div className="mt-6"><EmptyState eyebrow="The trunk is open" title="No approved shop items yet." description="Curated resources and goods appear here after they have been reviewed." action={<Link href="/shop/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Add a shop item <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}
        </section>
      </PageContainer>
    </PageCanvas>
  );
}

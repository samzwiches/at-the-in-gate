import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import ShippingRouteCard from "@/components/shippers/ShippingRouteCard";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import EmptyState from "@/components/ui/EmptyState";
import { getPublishedShippingRoutes } from "@/lib/supabase/shipping";

export default async function ShippersPage() {
  const routes = await getPublishedShippingRoutes();

  return (
    <PageCanvas appearanceKey="shippers.page" tone="mist" className="py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="shippers.hero" className="bg-[#dce4e4]">
          <header className="max-w-3xl border-b border-[#242721]/20 pb-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">Shipping and transportation</p>
            <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Plan the route before the trailer door closes.</h1>
            <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Published routes from real shipper directory listings, with the useful details in one place.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shippers/new" className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f5ed)] transition-colors hover:bg-[#7b2430]">Add a shipping route</Link>
              <Link href="/shippers/mine" className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Manage my routes</Link>
              <Link href="/directory/category/shippers" className="inline-flex items-center px-1 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] hover:text-[#7b2430]">Browse shipper listings</Link>
            </div>
          </header>
        </PageHero>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-3 border-b border-[#242721]/20 pb-4">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Routes on the board</p>
              <h2 className="mt-2 font-serif text-3xl text-[#242721]">Where they are headed next.</h2>
            </div>
            <p className="text-sm font-semibold text-[#56584f]">{routes.length} {routes.length === 1 ? "route" : "routes"}</p>
          </div>
          {routes.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {routes.map((route) => <ShippingRouteCard key={route.id} route={route} />)}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState eyebrow="The trailer board is clear" title="No approved shipping routes are posted." description="Shippers can publish the routes they are actively planning after their directory listing is approved." action={<Link href="/shippers/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Add a route</Link>} />
            </div>
          )}
        </section>
      </PageContainer>
    </PageCanvas>
  );
}

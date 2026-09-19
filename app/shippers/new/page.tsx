import Link from "next/link";
import ShippingRouteForm from "@/components/shippers/ShippingRouteForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";

export default async function NewShippingRoutePage() {
  const { user } = await requireActiveMembership("/shippers/new");
  const shipperEntries = await getPublishedDirectoryEntryOptionsForOwner(user.id, "shippers");

  return (
    <main className="bg-[#eef1ed] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs items={[{ label: "Shippers", href: "/shippers" }, { label: "Plan a route" }]} />

          <header className="mt-8 border-b border-[#242721]/20 pb-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Route planner</p>
            <h1 className="mt-3 max-w-4xl font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Map the trip. Fill the trailer. Waste fewer miles.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#56584f]">Post the route you are already running, show how many spaces are left, add pickup corridors and stops, and flag the return leg when you have room coming home.</p>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[['1', 'Plan the route', 'Origin, destination, dates, and the stops you can reasonably serve.'], ['2', 'Set capacity', 'Tell people how many trailer spaces exist and how many are already spoken for.'], ['3', 'Keep it current', 'Move the trip from planning to open, nearly full, full, departed, and completed.']].map(([number, title, copy]) => (
              <div key={number} className="border border-[#242721]/15 bg-[#f9f5ed] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b2430]">Step {number}</p>
                <p className="mt-2 font-serif text-2xl text-[#242721]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#56584f]">{copy}</p>
              </div>
            ))}
          </div>

          {shipperEntries.length > 0 ? (
            <ShippingRouteForm shipperEntries={shipperEntries} />
          ) : (
            <div className="mt-8 border border-[#b08d57]/60 bg-[#f9f5ed] p-5">
              <p className="font-serif text-2xl text-[#242721]">Your approved shipper listing comes first.</p>
              <p className="mt-3 text-sm leading-6 text-[#56584f]">Create a Directory entry in the Shippers category, send it for review, then return here to publish the routes you are running.</p>
              <Link href="/directory/new" className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Add a shipper listing</Link>
            </div>
          )}
        </div>
      </PageContainer>
    </main>
  );
}

import Link from "next/link";
import ShippingRouteForm from "@/components/shippers/ShippingRouteForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";

export default async function NewShippingRoutePage() {
  const user = await requireUser("/shippers/new");
  const shipperEntries = await getPublishedDirectoryEntryOptionsForOwner(user.id, "shippers");
  return <main className="bg-[#eef1ed] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Shippers", href: "/shippers" }, { label: "Add a route" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Add a shipping route</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Give people the route before they need it.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Routes are attached to an approved shipper listing, so the business identity and contact details stay together.</p></header>{shipperEntries.length > 0 ? <ShippingRouteForm shipperEntries={shipperEntries} /> : <div className="mt-8 border border-[#b08d57]/60 bg-[#f9f5ed] p-5"><p className="font-serif text-2xl text-[#242721]">Your approved shipper listing comes first.</p><p className="mt-3 text-sm leading-6 text-[#56584f]">Create a Directory entry in the Shippers category, send it for review, then return here to publish the routes you are running.</p><Link href="/directory/new" className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Add a shipper listing</Link></div>}</div></PageContainer></main>;
}

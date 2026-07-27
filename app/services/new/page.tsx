import Link from "next/link";
import ServiceOfferingForm from "@/components/services/ServiceOfferingForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";

export default async function NewServicePage() {
  const { user } = await requireActiveMembership("/services/new");
  const directoryEntries = await getPublishedDirectoryEntryOptionsForOwner(user.id);
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: "Add a service" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Add a service</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Make the useful offering easy to find.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Start with an approved directory listing, then add the specific service people can book or ask about.</p></header>{directoryEntries.length > 0 ? <ServiceOfferingForm directoryEntries={directoryEntries} /> : <div className="mt-8 border border-[#b08d57]/60 bg-[#f9f5ed] p-5"><p className="font-serif text-2xl text-[#242721]">Your approved directory listing comes first.</p><p className="mt-3 text-sm leading-6 text-[#56584f]">Add or finish a directory listing before creating a service. That identity is where your contact and location details live.</p><Link href="/directory/new" className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Add a directory listing</Link></div>}</div></PageContainer></main>;
}

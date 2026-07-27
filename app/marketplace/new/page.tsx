import Link from "next/link";
import ListingForm from "@/components/marketplace/ListingForm";
import PageContainer from "@/components/layout/PageContainer";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { getPublishedRelationshipPickerData } from "@/lib/supabase/relationships";

export default async function NewMarketplaceListingPage() {
  await requireActiveMembership("/marketplace/new");
  const { directoryEntries, events } = await getPublishedRelationshipPickerData();
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Link href="/marketplace" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">← Back to the market board</Link><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Bring one to the board</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">A good listing starts with the useful bits.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Save a draft for your records or send the listing for moderation review.</p></header><ListingForm directoryEntries={directoryEntries} events={events} /></div></PageContainer></main>;
}

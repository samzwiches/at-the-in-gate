import Link from "next/link";
import EventForm from "@/components/events/EventForm";
import PageContainer from "@/components/layout/PageContainer";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";

export default async function NewEventPage() {
  const { user } = await requireActiveMembership("/events/new");
  const directoryEntries = await getPublishedDirectoryEntryOptionsForOwner(user.id);

  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Link href="/events" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">← Back to events</Link><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Add an event</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Put a useful date on the board.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Send the details riders, parents, and programs need. Events are reviewed before appearing on the public calendar.</p></header><EventForm directoryEntries={directoryEntries} /></div></PageContainer></main>;
}

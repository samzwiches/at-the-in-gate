import Link from "next/link";
import JobForm from "@/components/jobs/JobForm";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";

export default async function NewJobPage() {
  const user = await requireUser("/jobs/new");
  const directoryEntries = await getPublishedDirectoryEntryOptionsForOwner(user.id);
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Link href="/jobs" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">← Back to jobs</Link><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Post a role</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Set clear expectations from the start.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Save a role for your records or send it to the board for moderation review.</p></header><JobForm directoryEntries={directoryEntries} /></div></PageContainer></main>;
}

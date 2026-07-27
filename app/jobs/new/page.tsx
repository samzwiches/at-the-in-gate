import Link from "next/link";
import JobForm from "@/components/jobs/JobForm";
import PageContainer from "@/components/layout/PageContainer";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { getPublishedEvents } from "@/lib/supabase/events";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";
import type { JobKind } from "@/lib/supabase/show-crew";

type NewJobPageProps = {
  searchParams: Promise<{ kind?: string; event?: string }>;
};

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const { user } = await requireActiveMembership("/jobs/new");
  const params = await searchParams;
  const initialJobKind: JobKind = params.kind === "show-crew" ? "show_crew" : "standard";
  const [directoryEntries, events] = await Promise.all([
    getPublishedDirectoryEntryOptionsForOwner(user.id),
    getPublishedEvents(),
  ]);
  const initialEventId = events.some((event) => event.id === params.event) ? params.event ?? "" : "";

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Link href="/jobs" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">← Back to jobs</Link>
          <header className="mt-8 border-b border-[#242721]/20 pb-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Post to the barn board</p>
            <h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Clear expectations, whether it is a season or a Saturday.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Post a traditional role or connect a specific horse show to the extra hands you need there.</p>
          </header>
          <JobForm directoryEntries={directoryEntries} events={events} initialJobKind={initialJobKind} initialEventId={initialEventId} />
        </div>
      </PageContainer>
    </main>
  );
}

import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import { getCommunitySpacesWithActivity } from "@/lib/community/queries";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { createClient } from "@/lib/supabase/server";

function activityCopy(count: number) {
  if (count === 0) {
    return "No notes yet";
  }

  return `${count} ${count === 1 ? "note" : "notes"} in the room`;
}

export default async function CommunityPage() {
  await requireActiveMembership("/community");
  const supabase = await createClient();
  const spaces = await getCommunitySpacesWithActivity(supabase);

  return (
    <PageCanvas appearanceKey="community.page" tone="blue-gray" className="py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-6xl">
          <PageHero mediaKey="community.hero">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">From the rail</p>
            <h1 className="section-appearance-heading-font mt-4 max-w-4xl text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">The good horse-world conversations have a home.</h1>
            <p className="section-appearance-body-font mt-5 max-w-3xl text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Choose a room for the practical notes, show-week questions, and small victories that are better shared with people who get it.</p>
          </PageHero>

          <section className="mt-10" aria-labelledby="community-spaces-title">
            <div className="flex flex-col gap-3 border-b border-[#242721]/20 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Member spaces</p><h2 id="community-spaces-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Find the right patch of aisle.</h2></div><p className="text-sm text-[#56584f]">{spaces.length} active spaces</p></div>
            <div className="mt-6 grid border-l border-t border-[#242721]/20 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space, index) => (
                <Link key={space.id} href={`/community/${space.slug}`} className="group min-h-56 border-b border-r border-[#242721]/20 bg-[#edf1f0] p-5 transition-colors hover:bg-[#f9f5ed] sm:p-6" aria-label={`Open ${space.title}`}>
                  <div className="flex items-start justify-between gap-4"><span className="font-serif text-3xl leading-none text-[#7b2430]">0{index + 1}</span><span className="text-xl text-[#2d4737] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true">↗</span></div>
                  <h3 className="mt-10 font-serif text-2xl leading-tight tracking-[-0.025em] text-[#242721]">{space.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#56584f]">{space.description ?? "A member space at the in gate."}</p>
                  <p className="mt-6 border-t border-[#242721]/15 pt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#2d4737]">{activityCopy(space.activityCount)}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </PageContainer>
    </PageCanvas>
  );
}

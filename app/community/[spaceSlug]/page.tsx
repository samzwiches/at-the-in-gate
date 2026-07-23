import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityPostCard, CommunityPostComposer } from "@/components/community/CommunityInteractive";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { getCommunityPostsForSpace, getCommunitySpaceBySlug } from "@/lib/community/queries";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { createClient } from "@/lib/supabase/server";

type CommunitySpacePageProps = {
  params: Promise<{ spaceSlug: string }>;
};

export default async function CommunitySpacePage({ params }: CommunitySpacePageProps) {
  const { spaceSlug } = await params;
  const nextPath = `/community/${encodeURIComponent(spaceSlug)}`;
  const { user } = await requireActiveMembership(nextPath);
  const supabase = await createClient();
  const space = await getCommunitySpaceBySlug(supabase, spaceSlug);

  if (!space) {
    notFound();
  }

  const posts = await getCommunityPostsForSpace(supabase, space.id, user.id);

  return (
    <main className="bg-[#dce4e4] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Link href="/community" className="inline-flex items-center gap-2 border-b border-[#2d4737] pb-1 text-sm font-semibold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]"><span aria-hidden="true">←</span> All community spaces</Link>
          <header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#7b2430]">Community space</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{space.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#56584f]">{space.description ?? "A member space at the in gate."}</p></header>

          <div className="mt-8"><CommunityPostComposer spaceId={space.id} /></div>

          <section className="mt-10" aria-labelledby="space-feed-title">
            <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">The notes</p><h2 id="space-feed-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">What is being passed down the aisle.</h2></div><p className="text-sm font-semibold text-[#686a61]">{posts.length} {posts.length === 1 ? "note" : "notes"}</p></div>
            {posts.length > 0 ? <div className="mt-6 space-y-5">{posts.map((post) => <CommunityPostCard key={post.id} post={post} viewerId={user.id} detailHref={`/community/${space.slug}/${post.id}`} />)}</div> : <div className="mt-6"><EmptyState eyebrow="The room is quiet" title="No one has opened this conversation." description="Start with the useful context you would share beside the in gate." /></div>}
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

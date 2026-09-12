import Image from "next/image";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import { getCommunitySpacesWithActivity, getRecentCommunityPosts } from "@/lib/community/queries";
import { getPublishedKidsCreationCount } from "@/lib/kids/queries";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { createClient } from "@/lib/supabase/server";

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function relativeDate(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export default async function CommunityPage() {
  const { user } = await requireActiveMembership("/community");
  const supabase = await createClient();
  const [spaces, recentPosts, kidsCreationCount] = await Promise.all([
    getCommunitySpacesWithActivity(supabase),
    getRecentCommunityPosts(supabase, user.id, 10),
    getPublishedKidsCreationCount(supabase),
  ]);
  const totalThreads = spaces.reduce((sum, space) => sum + space.activityCount, 0);

  return (
    <PageCanvas appearanceKey="community.page" tone="blue-gray" className="py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-7xl">
          <PageHero mediaKey="community.hero">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">The In Gate</p>
            <h1 className="section-appearance-heading-font mt-4 max-w-4xl text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Pull up to the rail. Somebody knows something.</h1>
            <p className="section-appearance-body-font mt-5 max-w-3xl text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">The horse world has always run on conversations. Ask the question, pass along the useful bit, compare notes, tell the story, and find out what everybody is talking about.</p>
          </PageHero>

          <div className="mt-8 grid gap-px overflow-hidden border border-[#242721]/20 bg-[#242721]/20 sm:grid-cols-3">
            <div className="bg-[#f9f5ed] p-5"><p className="text-3xl font-serif text-[#242721]">{totalThreads}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7b2430]">threads at the rail</p></div>
            <div className="bg-[#f9f5ed] p-5"><p className="text-3xl font-serif text-[#242721]">{spaces.length}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7b2430]">barn aisles</p></div>
            <div className="bg-[#f9f5ed] p-5"><p className="text-3xl font-serif text-[#242721]">{kidsCreationCount}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7b2430]">pony pages</p></div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,.75fr)]">
            <section aria-labelledby="latest-at-rail">
              <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4">
                <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Happening now</p><h2 id="latest-at-rail" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Latest from the rail.</h2></div>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#2d4737]">Newest first</span>
              </div>
              <div className="divide-y divide-[#242721]/15 border-b border-[#242721]/20">
                {recentPosts.length ? recentPosts.map((post) => (
                  <article key={post.id} className="grid gap-4 bg-[#f9f5ed]/75 px-4 py-5 transition-colors hover:bg-[#fffaf0] sm:grid-cols-[3.25rem_1fr_auto] sm:px-5">
                    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#242721]/20 bg-[#2d4737] font-serif text-sm text-[#f9f4eb]">
                      {post.authorAvatarUrl ? <Image src={post.authorAvatarUrl} alt="" fill sizes="48px" className="object-cover" /> : initials(post.authorName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#686a61]">
                        {post.authorUsername ? <Link href={`/members/${post.authorUsername}`} className="font-bold text-[#2d4737] hover:text-[#7b2430]">{post.authorName}</Link> : <span className="font-bold text-[#2d4737]">{post.authorName}</span>}
                        {post.authorIsFounding ? <span className="border border-[#b08d57]/60 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[#7b2430]">Founding</span> : null}
                        <span>in {post.spaceTitle}</span><span>·</span><span>{relativeDate(post.created_at)}</span>
                      </div>
                      <Link href={`/community/${post.spaceSlug}/${post.id}`} className="mt-1 block font-serif text-2xl leading-tight text-[#242721] hover:text-[#7b2430]">{post.title}</Link>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#56584f]">{post.body}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-[#686a61] sm:flex-col sm:items-end sm:justify-center"><span>{post.commentCount} {post.commentCount === 1 ? "reply" : "replies"}</span><span>{post.reactions.counts.like + post.reactions.counts.helpful + post.reactions.counts.cheer} reactions</span></div>
                  </article>
                )) : <div className="bg-[#f9f5ed]/75 p-8"><p className="font-serif text-2xl text-[#242721]">The rail is suspiciously quiet.</p><p className="mt-2 text-sm leading-6 text-[#56584f]">Pick an aisle and be the first person to give everybody something to talk about.</p></div>}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="border border-[#242721]/20 bg-[#2d4737] p-6 text-[#f9f4eb]"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#d8bd85]">Barn rule</p><p className="mt-3 font-serif text-3xl leading-tight">Bring the tea. Keep the cruelty.</p><p className="mt-3 text-sm leading-6 text-[#e4e1d8]">Questions, opinions, show stories and barn chatter belong here. Harassment, doxxing and dangerous nonsense do not.</p></div>
              <Link href="/account/profile" className="block border border-[#242721]/20 bg-[#e7e1d5] p-6 transition-colors hover:bg-[#f9f5ed]"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Your stall card</p><h3 className="mt-2 font-serif text-2xl text-[#242721]">Put a face to the username.</h3><p className="mt-3 text-sm leading-6 text-[#56584f]">Add your avatar, name, location and bio so people know who they are talking horses with.</p><p className="mt-5 text-sm font-bold text-[#2d4737]">Edit my profile →</p></Link>
            </aside>
          </div>

          <section className="mt-12" aria-labelledby="forum-rooms-title">
            <div className="flex flex-col gap-3 border-b border-[#242721]/20 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">The message board</p><h2 id="forum-rooms-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Pick your patch of aisle.</h2></div><p className="text-sm text-[#56584f]">Horse people contain multitudes. And opinions.</p></div>
            <div className="mt-6 grid border-l border-t border-[#242721]/20 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space, index) => <Link key={space.id} href={`/community/${space.slug}`} className="group min-h-52 border-b border-r border-[#242721]/20 bg-[#edf1f0] p-5 transition-colors hover:bg-[#f9f5ed] sm:p-6"><div className="flex items-start justify-between"><span className="font-serif text-2xl text-[#7b2430]">0{index + 1}</span><span className="text-xl text-[#2d4737] transition-transform group-hover:translate-x-1">→</span></div><h3 className="mt-8 font-serif text-2xl leading-tight text-[#242721]">{space.title}</h3><p className="mt-3 text-sm leading-6 text-[#56584f]">{space.description ?? "A conversation at the in gate."}</p><p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#2d4737]">{space.activityCount} {space.activityCount === 1 ? "thread" : "threads"}</p></Link>)}
            </div>
          </section>

          <Link href="/kids" className="mt-10 flex flex-col justify-between gap-5 border border-[#242721]/20 bg-[#f6efe2] p-6 transition-colors hover:bg-[#fffaf0] sm:flex-row sm:items-center sm:p-8"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Pony Kids Club</p><h2 className="mt-2 font-serif text-3xl text-[#242721]">The Pony Pages.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#56584f]">Parent managed stories, drawings, show memories and pony wisdom from the next generation.</p></div><span className="font-serif text-2xl text-[#2d4737]">Open the pages →</span></Link>
        </div>
      </PageContainer>
    </PageCanvas>
  );
}

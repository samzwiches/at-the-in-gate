import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityCommentThread, CommunityPostCard } from "@/components/community/CommunityInteractive";
import PageContainer from "@/components/layout/PageContainer";
import { getCommunityCommentsForPost, getCommunityPostById, getCommunitySpaceBySlug } from "@/lib/community/queries";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { createClient } from "@/lib/supabase/server";

type CommunityPostPageProps = {
  params: Promise<{ spaceSlug: string; postId: string }>;
};

export default async function CommunityPostPage({ params }: CommunityPostPageProps) {
  const { spaceSlug, postId } = await params;
  const nextPath = `/community/${encodeURIComponent(spaceSlug)}/${encodeURIComponent(postId)}`;
  const { user } = await requireActiveMembership(nextPath);
  const supabase = await createClient();
  const [space, post] = await Promise.all([
    getCommunitySpaceBySlug(supabase, spaceSlug),
    getCommunityPostById(supabase, postId, user.id),
  ]);

  if (!space || !post || post.space_id !== space.id) {
    notFound();
  }

  const comments = await getCommunityCommentsForPost(supabase, post.id, user.id);
  const canComment = post.moderation_status === "published" && post.deleted_at === null;

  return (
    <main className="bg-[#dce4e4] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Link href={`/community/${space.slug}`} className="inline-flex items-center gap-2 border-b border-[#2d4737] pb-1 text-sm font-semibold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]"><span aria-hidden="true">←</span> Back to {space.title}</Link>
          <div className="mt-8"><CommunityPostCard post={post} viewerId={user.id} fullBody /></div>
          <CommunityCommentThread postId={post.id} comments={comments} viewerId={user.id} canComment={canComment} />
        </div>
      </PageContainer>
    </main>
  );
}

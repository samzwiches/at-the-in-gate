import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  communityReactionTypes,
  type CommunityCommentView,
  type CommunityPostView,
  type CommunityReactionSummary,
  type CommunityReactionType,
  type CommunitySpaceWithActivity,
} from "@/lib/community/types";

type CommunityClient = SupabaseClient<Database>;

type VisibleIdentity = {
  id: string;
  display_name: string | null;
};

function throwCommunityQueryError(context: string, error: { message: string }) {
  throw new Error(`Could not ${context}: ${error.message}`);
}

function emptyReactionSummary(): CommunityReactionSummary {
  return {
    counts: { like: 0, helpful: 0, cheer: 0 },
    viewerReactionTypes: [],
  };
}

function isReactionType(value: string): value is CommunityReactionType {
  return (communityReactionTypes as readonly string[]).includes(value);
}

async function getVisibleIdentityNames(
  supabase: CommunityClient,
  authorIds: string[],
  viewerId: string
) {
  const uniqueIds = [...new Set(authorIds)];

  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", uniqueIds);

  if (error) {
    throwCommunityQueryError("load community author identities", error);
  }

  const identities = new Map(
    ((data ?? []) as VisibleIdentity[]).map((identity) => [identity.id, identity.display_name])
  );

  return new Map(
    uniqueIds.map((authorId) => {
      const displayName = identities.get(authorId)?.trim();

      if (displayName) {
        return [authorId, displayName];
      }

      return [authorId, authorId === viewerId ? "You" : "A member"];
    })
  );
}

function buildReactionSummaries(
  rows: Array<{
    post_id: string | null;
    comment_id: string | null;
    profile_id: string;
    reaction_type: string;
  }>,
  viewerId: string,
  target: "post" | "comment"
) {
  const summaries = new Map<string, CommunityReactionSummary>();

  for (const row of rows) {
    const targetId = target === "post" ? row.post_id : row.comment_id;

    if (!targetId || !isReactionType(row.reaction_type)) {
      continue;
    }

    const summary = summaries.get(targetId) ?? emptyReactionSummary();
    summary.counts[row.reaction_type] += 1;

    if (row.profile_id === viewerId) {
      summary.viewerReactionTypes.push(row.reaction_type);
    }

    summaries.set(targetId, summary);
  }

  return summaries;
}

export async function getCommunitySpacesWithActivity(supabase: CommunityClient) {
  const { data: spaces, error: spacesError } = await supabase
    .from("community_spaces")
    .select("id, slug, title, description, sort_order")
    .order("sort_order", { ascending: true });

  if (spacesError) {
    throwCommunityQueryError("load community spaces", spacesError);
  }

  const { data: posts, error: postsError } = await supabase
    .from("community_posts")
    .select("space_id")
    .eq("moderation_status", "published")
    .is("deleted_at", null);

  if (postsError) {
    throwCommunityQueryError("load community activity", postsError);
  }

  const counts = new Map<string, number>();
  (posts ?? []).forEach((post) => counts.set(post.space_id, (counts.get(post.space_id) ?? 0) + 1));

  return (spaces ?? []).map((space) => ({
    ...space,
    activityCount: counts.get(space.id) ?? 0,
  })) as CommunitySpaceWithActivity[];
}

export async function getCommunitySpaceBySlug(supabase: CommunityClient, slug: string) {
  const { data, error } = await supabase
    .from("community_spaces")
    .select("id, slug, title, description, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throwCommunityQueryError("load this community space", error);
  }

  return data;
}

export async function getCommunityPostsForSpace(
  supabase: CommunityClient,
  spaceId: string,
  viewerId: string
) {
  const { data: posts, error: postsError } = await supabase
    .from("community_posts")
    .select("id, space_id, author_id, title, body, moderation_status, is_pinned, edited_at, deleted_at, created_at")
    .eq("space_id", spaceId)
    .eq("moderation_status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (postsError) {
    throwCommunityQueryError("load community posts", postsError);
  }

  const postRows = posts ?? [];
  const postIds = postRows.map((post) => post.id);
  const [identityNames, commentResult, reactionResult] = await Promise.all([
    getVisibleIdentityNames(supabase, postRows.map((post) => post.author_id), viewerId),
    postIds.length > 0
      ? supabase
          .from("community_comments")
          .select("post_id")
          .in("post_id", postIds)
          .eq("moderation_status", "published")
          .is("deleted_at", null)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase
          .from("community_reactions")
          .select("post_id, comment_id, profile_id, reaction_type")
          .in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (commentResult.error) {
    throwCommunityQueryError("load comment counts", commentResult.error);
  }

  if (reactionResult.error) {
    throwCommunityQueryError("load reactions", reactionResult.error);
  }

  const commentCounts = new Map<string, number>();
  (commentResult.data ?? []).forEach((comment) => {
    commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) ?? 0) + 1);
  });
  const reactionSummaries = buildReactionSummaries(reactionResult.data ?? [], viewerId, "post");

  return postRows.map((post) => ({
    ...post,
    authorName: identityNames.get(post.author_id) ?? "A member",
    commentCount: commentCounts.get(post.id) ?? 0,
    reactions: reactionSummaries.get(post.id) ?? emptyReactionSummary(),
  })) as CommunityPostView[];
}

export async function getCommunityPostById(supabase: CommunityClient, postId: string, viewerId: string) {
  const { data: post, error: postError } = await supabase
    .from("community_posts")
    .select("id, space_id, author_id, title, body, moderation_status, is_pinned, edited_at, deleted_at, created_at")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    throwCommunityQueryError("load this community post", postError);
  }

  if (!post) {
    return null;
  }

  const [identityNames, commentsResult, reactionsResult] = await Promise.all([
    getVisibleIdentityNames(supabase, [post.author_id], viewerId),
    supabase
      .from("community_comments")
      .select("id")
      .eq("post_id", post.id)
      .eq("moderation_status", "published")
      .is("deleted_at", null),
    supabase
      .from("community_reactions")
      .select("post_id, comment_id, profile_id, reaction_type")
      .eq("post_id", post.id),
  ]);

  if (commentsResult.error) {
    throwCommunityQueryError("load the post comment count", commentsResult.error);
  }

  if (reactionsResult.error) {
    throwCommunityQueryError("load post reactions", reactionsResult.error);
  }

  const reactionSummaries = buildReactionSummaries(reactionsResult.data ?? [], viewerId, "post");

  return {
    ...post,
    authorName: identityNames.get(post.author_id) ?? "A member",
    commentCount: commentsResult.data?.length ?? 0,
    reactions: reactionSummaries.get(post.id) ?? emptyReactionSummary(),
  } as CommunityPostView;
}

export async function getCommunityCommentsForPost(
  supabase: CommunityClient,
  postId: string,
  viewerId: string
) {
  const { data: comments, error: commentsError } = await supabase
    .from("community_comments")
    .select("id, post_id, parent_comment_id, author_id, body, moderation_status, edited_at, deleted_at, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    throwCommunityQueryError("load comments", commentsError);
  }

  const commentRows = comments ?? [];
  const commentIds = commentRows.map((comment) => comment.id);
  const [identityNames, reactionsResult] = await Promise.all([
    getVisibleIdentityNames(supabase, commentRows.map((comment) => comment.author_id), viewerId),
    commentIds.length > 0
      ? supabase
          .from("community_reactions")
          .select("post_id, comment_id, profile_id, reaction_type")
          .in("comment_id", commentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (reactionsResult.error) {
    throwCommunityQueryError("load comment reactions", reactionsResult.error);
  }

  const reactionSummaries = buildReactionSummaries(reactionsResult.data ?? [], viewerId, "comment");

  return commentRows.map((comment) => ({
    ...comment,
    authorName: identityNames.get(comment.author_id) ?? "A member",
    reactions: reactionSummaries.get(comment.id) ?? emptyReactionSummary(),
  })) as CommunityCommentView[];
}

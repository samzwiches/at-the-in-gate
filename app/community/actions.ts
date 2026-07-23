"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import {
  communityReactionTypes,
  type CommunityActionState,
  type CommunityReactionType,
} from "@/lib/community/types";
import { getMembershipForProfile } from "@/lib/membership/membership";
import { createClient } from "@/lib/supabase/server";

const postTitleLength = { min: 1, max: 240 };
const postBodyLength = { min: 1, max: 20_000 };
const commentBodyLength = { min: 1, max: 10_000 };
const reportDetailsMaxLength = 2_000;
const reportReasons = ["spam", "harassment", "misinformation", "safety", "other"] as const;

type ReportReason = (typeof reportReasons)[number];

function success(message: string): CommunityActionState {
  return { status: "success", message };
}

function failure(message: string): CommunityActionState {
  return { status: "error", message };
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateLength(value: string, range: { min: number; max: number }, label: string) {
  if (value.length < range.min || value.length > range.max) {
    return `${label} must be between ${range.min} and ${range.max} characters.`;
  }

  return null;
}

function isReactionType(value: string): value is CommunityReactionType {
  return (communityReactionTypes as readonly string[]).includes(value);
}

function isReportReason(value: string): value is ReportReason {
  return (reportReasons as readonly string[]).includes(value);
}

async function getActiveActionMember() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { user: null, error: "Please sign in before using the community." };
  }

  try {
    const membership = await getMembershipForProfile(user.id);

    if (!membership.isEntitled) {
      return { user: null, error: "An active membership is required for community actions." };
    }
  } catch {
    return { user: null, error: "We could not confirm community access. Please try again." };
  }

  return { user, error: null };
}

async function getSpacePath(spaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_spaces")
    .select("slug")
    .eq("id", spaceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return `/community/${data.slug}`;
}

async function getPostPath(postId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("space_id")
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const spacePath = await getSpacePath(data.space_id);
  return spacePath ? `${spacePath}/${postId}` : null;
}

function revalidateCommunity(spacePath: string | null, postId?: string) {
  revalidatePath("/community");

  if (!spacePath) {
    return;
  }

  revalidatePath(spacePath);

  if (postId) {
    revalidatePath(`${spacePath}/${postId}`);
  }
}

export async function createCommunityPost(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const spaceId = formValue(formData, "spaceId");
  const title = formValue(formData, "title");
  const body = formValue(formData, "body");
  const titleError = validateLength(title, postTitleLength, "Title");
  const bodyError = validateLength(body, postBodyLength, "Note");

  if (!spaceId) {
    return failure("This community space is no longer available.");
  }

  if (titleError || bodyError) {
    return failure(titleError ?? bodyError ?? "Please check your note.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .insert({ space_id: spaceId, title, body })
    .select("id, space_id")
    .maybeSingle();

  if (error || !data) {
    return failure("We could not post that note. Please try again.");
  }

  revalidateCommunity(await getSpacePath(data.space_id), data.id);
  return success("Your note is at the rail.");
}

export async function updateCommunityPost(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const postId = formValue(formData, "postId");
  const title = formValue(formData, "title");
  const body = formValue(formData, "body");
  const titleError = validateLength(title, postTitleLength, "Title");
  const bodyError = validateLength(body, postBodyLength, "Note");

  if (!postId || titleError || bodyError) {
    return failure(titleError ?? bodyError ?? "That note is no longer available to edit.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .update({ title, body })
    .eq("id", postId)
    .select("id, space_id")
    .maybeSingle();

  if (error || !data) {
    return failure("Only the author can edit this note, or it is no longer available.");
  }

  revalidateCommunity(await getSpacePath(data.space_id), data.id);
  return success("Your note has been updated.");
}

export async function softDeleteCommunityPost(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const postId = formValue(formData, "postId");

  if (!postId) {
    return failure("That note is no longer available.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .select("id, space_id")
    .maybeSingle();

  if (error || !data) {
    return failure("Only the author can remove this note, or it has already been removed.");
  }

  revalidateCommunity(await getSpacePath(data.space_id), data.id);
  return success("Your note has been removed from the rail.");
}

export async function createCommunityComment(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const postId = formValue(formData, "postId");
  const body = formValue(formData, "body");
  const bodyError = validateLength(body, commentBodyLength, "Comment");

  if (!postId || bodyError) {
    return failure(bodyError ?? "That note is no longer available for comments.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_comments")
    .insert({ post_id: postId, body })
    .select("id, post_id")
    .maybeSingle();

  if (error || !data) {
    return failure("We could not add that comment. The note may no longer accept replies.");
  }

  const postPath = await getPostPath(data.post_id);
  revalidateCommunity(postPath?.replace(/\/[a-f0-9-]+$/i, "") ?? null, data.post_id);
  return success("Your comment is in the conversation.");
}

export async function updateCommunityComment(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const commentId = formValue(formData, "commentId");
  const body = formValue(formData, "body");
  const bodyError = validateLength(body, commentBodyLength, "Comment");

  if (!commentId || bodyError) {
    return failure(bodyError ?? "That comment is no longer available to edit.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_comments")
    .update({ body })
    .eq("id", commentId)
    .select("id, post_id")
    .maybeSingle();

  if (error || !data) {
    return failure("Only the author can edit this comment, or it is no longer available.");
  }

  const postPath = await getPostPath(data.post_id);
  revalidateCommunity(postPath?.replace(/\/[a-f0-9-]+$/i, "") ?? null, data.post_id);
  return success("Your comment has been updated.");
}

export async function softDeleteCommunityComment(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const commentId = formValue(formData, "commentId");

  if (!commentId) {
    return failure("That comment is no longer available.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .select("id, post_id")
    .maybeSingle();

  if (error || !data) {
    return failure("Only the author can remove this comment, or it has already been removed.");
  }

  const postPath = await getPostPath(data.post_id);
  revalidateCommunity(postPath?.replace(/\/[a-f0-9-]+$/i, "") ?? null, data.post_id);
  return success("Your comment has been removed from the conversation.");
}

export async function toggleCommunityReaction(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const postId = formValue(formData, "postId");
  const commentId = formValue(formData, "commentId");
  const reactionType = formValue(formData, "reactionType");

  if ((postId && commentId) || (!postId && !commentId) || !isReactionType(reactionType)) {
    return failure("Choose one of the listed reactions.");
  }

  const supabase = await createClient();
  const targetColumn = postId ? "post_id" : "comment_id";
  const targetId = postId || commentId;
  const { data: existing, error: existingError } = await supabase
    .from("community_reactions")
    .select("id")
    .eq("profile_id", user.id)
    .eq(targetColumn, targetId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existingError) {
    return failure("We could not check that reaction. Please try again.");
  }

  if (existing) {
    const { error } = await supabase.from("community_reactions").delete().eq("id", existing.id);

    if (error) {
      return failure("We could not remove that reaction. Please try again.");
    }
  } else {
    const { error } = postId
      ? await supabase.from("community_reactions").insert({ post_id: postId, reaction_type: reactionType })
      : await supabase.from("community_reactions").insert({ comment_id: commentId!, reaction_type: reactionType });

    if (error) {
      return failure("We could not add that reaction. Please try again.");
    }
  }

  const contentPostId = postId || (await getCommentPostId(commentId));
  const postPath = contentPostId ? await getPostPath(contentPostId) : null;
  revalidateCommunity(postPath?.replace(/\/[a-f0-9-]+$/i, "") ?? null, contentPostId ?? undefined);
  return success(existing ? "Reaction removed." : "Reaction added.");
}

async function getCommentPostId(commentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_comments")
    .select("post_id")
    .eq("id", commentId)
    .maybeSingle();

  return error || !data ? null : data.post_id;
}

export async function createCommunityReport(
  _previousState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const { user, error: memberError } = await getActiveActionMember();

  if (!user) {
    return failure(memberError);
  }

  const postId = formValue(formData, "postId");
  const commentId = formValue(formData, "commentId");
  const reason = formValue(formData, "reason");
  const details = formValue(formData, "details");

  if ((postId && commentId) || (!postId && !commentId) || !isReportReason(reason)) {
    return failure("Choose a reason for this report.");
  }

  if (details.length > reportDetailsMaxLength) {
    return failure(`Details must be ${reportDetailsMaxLength} characters or fewer.`);
  }

  const supabase = await createClient();
  const { error } = postId
    ? await supabase.from("community_reports").insert({ post_id: postId, reason, details: details || null })
    : await supabase.from("community_reports").insert({ comment_id: commentId!, reason, details: details || null });

  if (error) {
    return failure("We could not send that report. Please try again.");
  }

  return success("Thank you. The report has been sent to the moderation queue.");
}

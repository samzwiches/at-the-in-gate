import type { Database } from "@/lib/database.types";

type CommunityPostRow = Database["public"]["Tables"]["community_posts"]["Row"];
type CommunityCommentRow = Database["public"]["Tables"]["community_comments"]["Row"];
type CommunitySpaceRow = Database["public"]["Tables"]["community_spaces"]["Row"];

export const communityReactionTypes = ["like", "helpful", "cheer"] as const;

export type CommunityReactionType = (typeof communityReactionTypes)[number];

export type CommunityActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialCommunityActionState: CommunityActionState = {
  status: "idle",
  message: "",
};

export type CommunitySpaceWithActivity = Pick<
  CommunitySpaceRow,
  "id" | "slug" | "title" | "description" | "sort_order"
> & {
  activityCount: number;
};

export type CommunityReactionSummary = {
  counts: Record<CommunityReactionType, number>;
  viewerReactionTypes: CommunityReactionType[];
};

export type CommunityAuthorIdentity = {
  authorName: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  authorIsFounding: boolean;
};

export type CommunityPostView = Pick<
  CommunityPostRow,
  | "id"
  | "space_id"
  | "author_id"
  | "title"
  | "body"
  | "moderation_status"
  | "is_pinned"
  | "edited_at"
  | "deleted_at"
  | "created_at"
> &
  CommunityAuthorIdentity & {
    commentCount: number;
    reactions: CommunityReactionSummary;
  };

export type CommunityCommentView = Pick<
  CommunityCommentRow,
  | "id"
  | "post_id"
  | "parent_comment_id"
  | "author_id"
  | "body"
  | "moderation_status"
  | "edited_at"
  | "deleted_at"
  | "created_at"
> &
  CommunityAuthorIdentity & {
    reactions: CommunityReactionSummary;
  };

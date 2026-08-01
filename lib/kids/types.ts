export const kidsCreationCategories = [
  "story",
  "drawing",
  "comic",
  "poem",
  "show-memory",
  "pony-tip",
] as const;

export const kidsAgeGroups = [
  "little-rider",
  "8-10",
  "11-13",
  "14-17",
  "not-shared",
] as const;

export const kidsReactionTypes = [
  "love-it",
  "so-creative",
  "great-job",
] as const;

export type KidsCreationCategory = (typeof kidsCreationCategories)[number];
export type KidsAgeGroup = (typeof kidsAgeGroups)[number];
export type KidsReactionType = (typeof kidsReactionTypes)[number];
export type KidsModerationStatus = "pending" | "published" | "hidden" | "removed";

export const kidsCategoryLabels: Record<KidsCreationCategory, string> = {
  story: "Story",
  drawing: "Drawing",
  comic: "Pony comic",
  poem: "Poem",
  "show-memory": "Show memory",
  "pony-tip": "Pony tip",
};

export const kidsAgeGroupLabels: Record<KidsAgeGroup, string> = {
  "little-rider": "Little rider",
  "8-10": "Ages 8 to 10",
  "11-13": "Ages 11 to 13",
  "14-17": "Ages 14 to 17",
  "not-shared": "Age not shared",
};

export const kidsReactionLabels: Record<KidsReactionType, string> = {
  "love-it": "Love it",
  "so-creative": "So creative",
  "great-job": "Great job",
};

export type KidsCreationRow = {
  id: string;
  parent_profile_id: string;
  child_display_name: string;
  child_age_group: KidsAgeGroup;
  category: KidsCreationCategory;
  title: string;
  body: string | null;
  image_path: string | null;
  image_alt_text: string | null;
  guardian_attested: boolean;
  moderation_status: KidsModerationStatus;
  moderated_at: string | null;
  moderated_by_profile_id: string | null;
  created_at: string;
  updated_at: string;
};

export type KidsReactionRow = {
  id: string;
  creation_id: string;
  profile_id: string;
  reaction_type: KidsReactionType;
  created_at: string;
};

export type KidsCreationView = KidsCreationRow & {
  imageUrl: string | null;
  parentName: string;
  parentUsername: string | null;
  reactions: Record<KidsReactionType, number>;
  viewerReactions: KidsReactionType[];
};

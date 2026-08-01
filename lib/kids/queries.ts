import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getKidsClient } from "@/lib/kids/client";
import {
  kidsReactionTypes,
  type KidsCreationRow,
  type KidsCreationView,
  type KidsReactionRow,
  type KidsReactionType,
} from "@/lib/kids/types";

type BaseClient = SupabaseClient<Database>;

type VisibleParentProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
};

function emptyReactionCounts(): Record<KidsReactionType, number> {
  return {
    "love-it": 0,
    "so-creative": 0,
    "great-job": 0,
  };
}

async function buildCreationViews(
  supabase: BaseClient,
  rows: KidsCreationRow[],
  viewerId: string
): Promise<KidsCreationView[]> {
  const kids = getKidsClient(supabase);
  const creationIds = rows.map((row) => row.id);
  const parentIds = [...new Set(rows.map((row) => row.parent_profile_id))];

  const [profilesResult, reactionsResult] = await Promise.all([
    parentIds.length
      ? supabase
          .from("profiles")
          .select("id, display_name, username")
          .in("id", parentIds)
      : Promise.resolve({ data: [], error: null }),
    creationIds.length
      ? kids
          .from("kids_creation_reactions")
          .select("id, creation_id, profile_id, reaction_type, created_at")
          .in("creation_id", creationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    throw new Error(`Could not load Pony Pages parent profiles: ${profilesResult.error.message}`);
  }

  if (reactionsResult.error) {
    throw new Error(`Could not load Pony Pages reactions: ${reactionsResult.error.message}`);
  }

  const profiles = new Map(
    ((profilesResult.data ?? []) as VisibleParentProfile[]).map((profile) => [profile.id, profile])
  );
  const reactionRows = (reactionsResult.data ?? []) as KidsReactionRow[];

  return Promise.all(
    rows.map(async (row) => {
      const reactionCounts = emptyReactionCounts();
      const viewerReactions: KidsReactionType[] = [];

      for (const reaction of reactionRows) {
        if (reaction.creation_id !== row.id || !kidsReactionTypes.includes(reaction.reaction_type)) {
          continue;
        }

        reactionCounts[reaction.reaction_type] += 1;
        if (reaction.profile_id === viewerId) {
          viewerReactions.push(reaction.reaction_type);
        }
      }

      let imageUrl: string | null = null;
      if (row.image_path) {
        const { data, error } = await supabase.storage
          .from("kids-creations")
          .createSignedUrl(row.image_path, 60 * 60);

        if (!error) {
          imageUrl = data.signedUrl;
        }
      }

      const parent = profiles.get(row.parent_profile_id);
      return {
        ...row,
        imageUrl,
        parentName: parent?.display_name?.trim() || "A parent or guardian",
        parentUsername: parent?.username ?? null,
        reactions: reactionCounts,
        viewerReactions,
      };
    })
  );
}

export async function getPublishedKidsCreations(supabase: BaseClient, viewerId: string) {
  const kids = getKidsClient(supabase);
  const { data, error } = await kids
    .from("kids_creations")
    .select(
      "id, parent_profile_id, child_display_name, child_age_group, category, title, body, image_path, image_alt_text, guardian_attested, moderation_status, moderated_at, moderated_by_profile_id, created_at, updated_at"
    )
    .eq("moderation_status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load The Pony Pages: ${error.message}`);
  }

  return buildCreationViews(supabase, (data ?? []) as KidsCreationRow[], viewerId);
}

export async function getKidsCreationsForParent(supabase: BaseClient, parentProfileId: string) {
  const kids = getKidsClient(supabase);
  const { data, error } = await kids
    .from("kids_creations")
    .select(
      "id, parent_profile_id, child_display_name, child_age_group, category, title, body, image_path, image_alt_text, guardian_attested, moderation_status, moderated_at, moderated_by_profile_id, created_at, updated_at"
    )
    .eq("parent_profile_id", parentProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your Pony Pages submissions: ${error.message}`);
  }

  return buildCreationViews(supabase, (data ?? []) as KidsCreationRow[], parentProfileId);
}

export async function getKidsCreationsForModeration(supabase: BaseClient, viewerId: string) {
  const kids = getKidsClient(supabase);
  const { data, error } = await kids
    .from("kids_creations")
    .select(
      "id, parent_profile_id, child_display_name, child_age_group, category, title, body, image_path, image_alt_text, guardian_attested, moderation_status, moderated_at, moderated_by_profile_id, created_at, updated_at"
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load the Pony Pages moderation queue: ${error.message}`);
  }

  return buildCreationViews(supabase, (data ?? []) as KidsCreationRow[], viewerId);
}

export async function getPublishedKidsCreationCount(supabase: BaseClient) {
  const kids = getKidsClient(supabase);
  const { count, error } = await kids
    .from("kids_creations")
    .select("id", { count: "exact", head: true })
    .eq("moderation_status", "published");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

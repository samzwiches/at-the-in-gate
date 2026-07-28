"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { getKidsClient } from "@/lib/kids/client";
import {
  kidsAgeGroups,
  kidsCreationCategories,
  kidsReactionTypes,
  type KidsAgeGroup,
  type KidsCreationCategory,
  type KidsReactionType,
} from "@/lib/kids/types";
import { createClient } from "@/lib/supabase/server";

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function cleanText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function kidsRedirect(params: Record<string, string>): never {
  redirect(`/kids?${new URLSearchParams(params)}`);
}

function isCategory(value: string): value is KidsCreationCategory {
  return (kidsCreationCategories as readonly string[]).includes(value);
}

function isAgeGroup(value: string): value is KidsAgeGroup {
  return (kidsAgeGroups as readonly string[]).includes(value);
}

function isReaction(value: string): value is KidsReactionType {
  return (kidsReactionTypes as readonly string[]).includes(value);
}

export async function submitKidsCreation(formData: FormData) {
  const { user } = await requireActiveMembership("/kids");
  const childDisplayName = cleanText(formData, "child_display_name");
  const childAgeGroup = cleanText(formData, "child_age_group");
  const category = cleanText(formData, "category");
  const title = cleanText(formData, "title");
  const body = cleanText(formData, "body");
  const imageAltText = cleanText(formData, "image_alt_text");
  const guardianAttested = formData.get("guardian_attested") === "on";
  const artwork = formData.get("artwork");
  const creationId = randomUUID();

  if (childDisplayName.length < 1 || childDisplayName.length > 40) {
    kidsRedirect({ error: "Use only a first name or nickname, up to 40 characters." });
  }

  if (!isAgeGroup(childAgeGroup)) {
    kidsRedirect({ error: "Choose one of the broad age groups." });
  }

  if (!isCategory(category)) {
    kidsRedirect({ error: "Choose a story or artwork category." });
  }

  if (title.length < 1 || title.length > 160) {
    kidsRedirect({ error: "Add a title between 1 and 160 characters." });
  }

  if (body.length > 8000) {
    kidsRedirect({ error: "Keep the written piece to 8,000 characters or fewer." });
  }

  if (imageAltText.length > 300) {
    kidsRedirect({ error: "Keep the artwork description to 300 characters or fewer." });
  }

  if (!guardianAttested) {
    kidsRedirect({ error: "A parent or guardian must approve the submission and privacy statement." });
  }

  const hasArtwork = artwork instanceof File && artwork.size > 0;
  if (!body && !hasArtwork) {
    kidsRedirect({ error: "Add a story, poem, memory, tip, or artwork image before submitting." });
  }

  let imagePath: string | null = null;
  const supabase = await createClient();
  const kids = getKidsClient(supabase);

  if (hasArtwork) {
    const extension = allowedImageTypes.get(artwork.type);

    if (!extension) {
      kidsRedirect({ error: "Artwork must be a JPG, PNG, or WebP image." });
    }

    if (artwork.size > 6 * 1024 * 1024) {
      kidsRedirect({ error: "Keep the artwork image under 6 MB." });
    }

    imagePath = `${user.id}/${creationId}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("kids-creations")
      .upload(imagePath, new Uint8Array(await artwork.arrayBuffer()), {
        contentType: artwork.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      kidsRedirect({ error: "We could not upload that artwork. Try a different image." });
    }
  }

  const { error: insertError } = await kids.from("kids_creations").insert({
    id: creationId,
    parent_profile_id: user.id,
    child_display_name: childDisplayName,
    child_age_group: childAgeGroup,
    category,
    title,
    body: body || null,
    image_path: imagePath,
    image_alt_text: imageAltText || null,
    guardian_attested: true,
  });

  if (insertError) {
    if (imagePath) {
      await supabase.storage.from("kids-creations").remove([imagePath]);
    }

    kidsRedirect({ error: "We could not save that submission. Please try again." });
  }

  revalidatePath("/kids");
  revalidatePath("/admin/kids");
  kidsRedirect({ submitted: "1" });
}

export async function toggleKidsReaction(formData: FormData) {
  const { user } = await requireActiveMembership("/kids");
  const creationId = cleanText(formData, "creation_id");
  const reactionType = cleanText(formData, "reaction_type");

  if (!creationId || !isReaction(reactionType)) {
    return;
  }

  const supabase = await createClient();
  const kids = getKidsClient(supabase);
  const { data: existing, error: existingError } = await kids
    .from("kids_creation_reactions")
    .select("id")
    .eq("creation_id", creationId)
    .eq("profile_id", user.id)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existingError) {
    return;
  }

  if (existing) {
    await kids.from("kids_creation_reactions").delete().eq("id", existing.id);
  } else {
    await kids.from("kids_creation_reactions").insert({
      creation_id: creationId,
      reaction_type: reactionType,
    });
  }

  revalidatePath("/kids");
}

export async function deletePendingKidsCreation(formData: FormData) {
  const { user } = await requireActiveMembership("/kids");
  const creationId = cleanText(formData, "creation_id");

  if (!creationId) {
    return;
  }

  const supabase = await createClient();
  const kids = getKidsClient(supabase);
  const { data: creation } = await kids
    .from("kids_creations")
    .select("id, image_path")
    .eq("id", creationId)
    .eq("parent_profile_id", user.id)
    .eq("moderation_status", "pending")
    .maybeSingle();

  if (!creation) {
    return;
  }

  const { error } = await kids.from("kids_creations").delete().eq("id", creation.id);
  if (!error && creation.image_path) {
    await supabase.storage.from("kids-creations").remove([creation.image_path]);
  }

  revalidatePath("/kids");
  revalidatePath("/admin/kids");
}

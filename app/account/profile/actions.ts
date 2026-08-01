"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getMemberProfileClient } from "@/lib/members/profile";
import { createClient } from "@/lib/supabase/server";

const allowedAvatarTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function cleanText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function profileRedirect(params: Record<string, string>): never {
  redirect(`/account/profile?${new URLSearchParams(params)}`);
}

export async function saveMemberProfile(formData: FormData) {
  const user = await requireUser("/account/profile");
  const username = cleanText(formData, "username").toLowerCase().replace(/^@/, "");
  const displayName = cleanText(formData, "display_name");
  const bio = cleanText(formData, "bio");
  const location = cleanText(formData, "location");
  const isPublic = formData.get("is_public") === "on";
  const removeAvatar = formData.get("remove_avatar") === "on";
  const avatar = formData.get("avatar");

  if (!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(username)) {
    profileRedirect({
      error: "Choose a username with 3 to 40 lowercase letters, numbers, underscores, or hyphens.",
    });
  }

  if (displayName.length < 1 || displayName.length > 100) {
    profileRedirect({ error: "Add a display name between 1 and 100 characters." });
  }

  if (bio.length > 1000) {
    profileRedirect({ error: "Keep your profile introduction to 1,000 characters or fewer." });
  }

  if (location.length > 150) {
    profileRedirect({ error: "Keep your location to 150 characters or fewer." });
  }

  const supabase = await createClient();
  const profiles = getMemberProfileClient(supabase);
  const { data: currentProfile, error: currentProfileError } = await profiles
    .from("profiles")
    .select("id, username, display_name, bio, location, avatar_path, is_public, founding_member, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (currentProfileError) {
    profileRedirect({ error: "We could not load your profile. Please try again." });
  }

  let avatarPath = currentProfile.avatar_path;

  if (removeAvatar && avatarPath) {
    const { error: removeError } = await supabase.storage
      .from("profile-avatars")
      .remove([avatarPath]);

    if (removeError) {
      profileRedirect({ error: "We could not remove your current profile picture." });
    }

    avatarPath = null;
  }

  if (avatar instanceof File && avatar.size > 0) {
    const extension = allowedAvatarTypes.get(avatar.type);

    if (!extension) {
      profileRedirect({ error: "Profile pictures must be JPG, PNG, or WebP files." });
    }

    if (avatar.size > 4 * 1024 * 1024) {
      profileRedirect({ error: "Keep the profile picture under 4 MB." });
    }

    const nextAvatarPath = `${user.id}/avatar.${extension}`;

    if (avatarPath && avatarPath !== nextAvatarPath) {
      const { error: oldAvatarError } = await supabase.storage
        .from("profile-avatars")
        .remove([avatarPath]);

      if (oldAvatarError) {
        profileRedirect({ error: "We could not replace your current profile picture." });
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(nextAvatarPath, new Uint8Array(await avatar.arrayBuffer()), {
        contentType: avatar.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      profileRedirect({ error: "We could not upload that profile picture. Please try a different image." });
    }

    avatarPath = nextAvatarPath;
  }

  const { error: updateError } = await profiles
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      bio: bio || null,
      location: location || null,
      avatar_path: avatarPath,
      is_public: isPublic,
    })
    .eq("id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      profileRedirect({ error: "That username is already taken. Try another one." });
    }

    profileRedirect({ error: "We could not save your profile. Please try again." });
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/community", "layout");
  revalidatePath(`/members/${username}`);
  profileRedirect({ saved: "1" });
}

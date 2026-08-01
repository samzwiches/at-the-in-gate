"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/membership/require-active-membership";
import { getKidsClient } from "@/lib/kids/client";
import type { KidsModerationStatus } from "@/lib/kids/types";
import { createClient } from "@/lib/supabase/server";

const allowedStatuses: KidsModerationStatus[] = ["pending", "published", "hidden", "removed"];

function cleanText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function moderateKidsCreation(formData: FormData) {
  await requireAdministrator("/admin/kids");
  const creationId = cleanText(formData, "creation_id");
  const nextStatus = cleanText(formData, "moderation_status") as KidsModerationStatus;

  if (!creationId || !allowedStatuses.includes(nextStatus)) {
    return;
  }

  const supabase = await createClient();
  const kids = getKidsClient(supabase);
  await kids
    .from("kids_creations")
    .update({ moderation_status: nextStatus })
    .eq("id", creationId);

  revalidatePath("/admin");
  revalidatePath("/admin/kids");
  revalidatePath("/community");
  revalidatePath("/kids");
}

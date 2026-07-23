"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { directoryCategories } from "@/lib/taxonomy";
import { createClient } from "@/lib/supabase/server";

type DirectoryPayload = {
  name: string;
  category: string;
  entry_type: string;
  description: string;
  city: string;
  state: string;
  service_area: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  image_path: string | null;
  moderation_status: "draft" | "pending";
};

type DirectoryPayloadResult = { payload: DirectoryPayload; error?: never } | { payload?: never; error: string };

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function optionalValue(formData: FormData, key: string) {
  const field = value(formData, key);
  return field || null;
}

function outcome(status: FormActionState["status"], message: string): FormActionState {
  return { status, message };
}

function validWebsite(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isDirectoryCategory(category: string) {
  return directoryCategories.some((item) => item.slug === category);
}

function revalidateDirectoryPaths(slug?: string, category?: string) {
  revalidatePath("/");
  revalidatePath("/directory");
  revalidatePath("/directory/mine");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  directoryCategories.forEach((item) => revalidatePath(`/directory/category/${item.slug}`));
  if (slug) revalidatePath(`/directory/${slug}`);
  if (category) revalidatePath(`/directory/category/${category}`);
}

function directoryPayload(formData: FormData): DirectoryPayloadResult {
  const name = value(formData, "name");
  const category = value(formData, "category");
  const entryType = value(formData, "entryType");
  const description = value(formData, "description");
  const city = value(formData, "city");
  const state = value(formData, "state");
  const website = optionalValue(formData, "website");
  const email = optionalValue(formData, "email");

  if (!name || !category || !entryType || !description || !city || !state) {
    return { error: "Please complete every required directory field." as const };
  }

  if (!isDirectoryCategory(category)) {
    return { error: "Choose a valid directory category." as const };
  }

  if (!['individual', 'business', 'service'].includes(entryType)) {
    return { error: "Choose a valid listing type." as const };
  }

  if (website && !validWebsite(website)) {
    return { error: "Use a full website address beginning with http:// or https://." as const };
  }

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Use a valid email address." as const };
  }

  return {
    payload: {
      name,
      category,
      entry_type: entryType,
      description,
      city,
      state,
      service_area: optionalValue(formData, "serviceArea"),
      website,
      email,
      phone: optionalValue(formData, "phone"),
      image_path: optionalValue(formData, "imagePath"),
      moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending",
    },
  };
}

export async function createDirectoryEntry(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  if (!user) return outcome("error", "Please sign in before adding a directory listing.");

  const result = directoryPayload(formData);
  if (!result.payload) return outcome("error", result.error ?? "Please check the directory details.");
  const payload = result.payload;

  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(payload.name);
  let { error } = await supabase.from("directory_entries").insert({ ...payload, slug: baseSlug });

  if (error?.code === "23505") {
    ({ error } = await supabase
      .from("directory_entries")
      .insert({ ...payload, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` }));
  }

  if (error) return outcome("error", "We could not save this directory listing. Please check the details and try again.");

  revalidateDirectoryPaths(undefined, payload.category);
  return outcome("success", payload.moderation_status === "draft" ? "Your directory draft has been saved." : "Your directory listing has been sent for review.");
}

export async function updateDirectoryEntry(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const entryId = value(formData, "entryId");
  if (!user || !entryId) return outcome("error", "Please sign in before managing this directory listing.");

  const result = directoryPayload(formData);
  if (!result.payload) return outcome("error", result.error ?? "Please check the directory details.");
  const payload = result.payload;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_entries")
    .update(payload)
    .eq("id", entryId)
    .eq("owner_id", user.id)
    .select("slug, category")
    .maybeSingle();

  if (error || !data) return outcome("error", "Only the listing owner can update this entry.");

  revalidateDirectoryPaths(data.slug, data.category);
  return outcome("success", payload.moderation_status === "draft" ? "Your directory draft has been updated." : "Your changes have been sent for review.");
}

export async function archiveDirectoryEntry(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const entryId = value(formData, "entryId");
  if (!user || !entryId) return outcome("error", "Please sign in before managing this directory listing.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_entries")
    .update({ moderation_status: "archived" })
    .eq("id", entryId)
    .eq("owner_id", user.id)
    .select("slug, category")
    .maybeSingle();

  if (error || !data) return outcome("error", "Only the listing owner can archive this entry.");

  revalidateDirectoryPaths(data.slug, data.category);
  return outcome("success", "Directory listing archived.");
}

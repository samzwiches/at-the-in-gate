"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { serviceCategories } from "@/lib/taxonomy";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) { const field = formData.get(key); return typeof field === "string" ? field.trim() : ""; }
function optionalValue(formData: FormData, key: string) { return value(formData, key) || null; }
function outcome(status: FormActionState["status"], message: string): FormActionState { return { status, message }; }
type ServiceOfferingPayload = Pick<Database["public"]["Tables"]["service_offerings"]["Insert"], "directory_entry_id" | "title" | "category" | "description" | "service_area" | "website" | "image_path" | "moderation_status">;

function validWebsite(website: string | null) {
  if (!website) return true;
  try { const parsed = new URL(website); return parsed.protocol === "https:" || parsed.protocol === "http:"; } catch { return false; }
}

function validPayload(formData: FormData): { error: string } | { payload: ServiceOfferingPayload } {
  const directoryEntryId = value(formData, "directoryEntryId");
  const title = value(formData, "title");
  const category = value(formData, "category");
  const description = value(formData, "description");
  const website = optionalValue(formData, "website");
  if (!directoryEntryId || !title || !category || !description) return { error: "Please complete every required service field." as const };
  if (!serviceCategories.some((item) => item.slug === category)) return { error: "Choose a valid service category." as const };
  if (!validWebsite(website)) return { error: "Use a full website address beginning with http:// or https://." as const };
  return { payload: { directory_entry_id: directoryEntryId, title, category, description, service_area: optionalValue(formData, "serviceArea"), website, image_path: optionalValue(formData, "imagePath"), moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending" } };
}

function revalidateServices(slug?: string) {
  ["/", "/services", "/services/mine", "/directory", "/dashboard", "/admin"].forEach((path) => revalidatePath(path));
  serviceCategories.forEach((item) => revalidatePath(`/services/category/${item.slug}`));
  if (slug) revalidatePath(`/services/${slug}`);
}

export async function createServiceOffering(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  if (!user) return outcome("error", "Please sign in before adding a service.");
  const result = validPayload(formData);
  if (!("payload" in result)) return outcome("error", result.error);
  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(result.payload.title);
  let { error } = await supabase.from("service_offerings").insert({ ...result.payload, slug: baseSlug });
  if (error?.code === "23505") ({ error } = await supabase.from("service_offerings").insert({ ...result.payload, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` }));
  if (error) return outcome("error", "We could not save this service. Confirm the selected directory listing is yours and published.");
  revalidateServices();
  return outcome("success", result.payload.moderation_status === "draft" ? "Your service draft has been saved." : "Your service has been sent for review.");
}

export async function updateServiceOffering(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const serviceId = value(formData, "serviceId");
  if (!user || !serviceId) return outcome("error", "Please sign in before managing this service.");
  const result = validPayload(formData);
  if (!("payload" in result)) return outcome("error", result.error);
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_offerings").update(result.payload).eq("id", serviceId).select("slug").maybeSingle();
  if (error || !data) return outcome("error", "Only the related directory owner can update this service.");
  revalidateServices(data.slug);
  return outcome("success", result.payload.moderation_status === "draft" ? "Your service draft has been updated." : "Your changes have been sent for review.");
}

export async function archiveServiceOffering(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const serviceId = value(formData, "serviceId");
  if (!user || !serviceId) return outcome("error", "Please sign in before managing this service.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_offerings").update({ moderation_status: "archived" }).eq("id", serviceId).select("slug").maybeSingle();
  if (error || !data) return outcome("error", "Only the related directory owner can archive this service.");
  revalidateServices(data.slug);
  return outcome("success", "Service archived.");
}

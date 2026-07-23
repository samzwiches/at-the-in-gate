import "server-only";

import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ServiceRow = Database["public"]["Tables"]["service_offerings"]["Row"];

export type ServiceOfferingCard = Pick<ServiceRow, "id" | "slug" | "directory_entry_id" | "title" | "category" | "description" | "service_area" | "image_path" | "moderation_status">;
export type ServiceOfferingDetail = ServiceOfferingCard & Pick<ServiceRow, "website" | "created_at" | "updated_at">;
export type ServiceModerationItem = Pick<ServiceRow, "id" | "slug" | "title" | "category" | "directory_entry_id" | "moderation_status" | "created_at">;

const cardColumns = "id, slug, directory_entry_id, title, category, description, service_area, image_path, moderation_status";
const detailColumns = `${cardColumns}, website, created_at, updated_at`;

export function serviceCategoryLabel(category: string) {
  return category.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function getPublishedServiceOfferings(category?: string) {
  const supabase = await createClient();
  let query = supabase.from("service_offerings").select(cardColumns).eq("moderation_status", "published").order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load services: ${error.message}`);
  return (data ?? []) as ServiceOfferingCard[];
}

export async function getServiceOfferingBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_offerings").select(detailColumns).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load this service: ${error.message}`);
  return data as ServiceOfferingDetail | null;
}

export async function getServiceOfferingsForOwnerDirectoryEntries(directoryEntryIds: string[]) {
  if (directoryEntryIds.length === 0) return [] as ServiceOfferingDetail[];
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_offerings").select(detailColumns).in("directory_entry_id", directoryEntryIds).order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load your services: ${error.message}`);
  return (data ?? []) as ServiceOfferingDetail[];
}

export async function getPublishedServiceOfferingsForDirectoryEntry(directoryEntryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_offerings").select(cardColumns).eq("directory_entry_id", directoryEntryId).eq("moderation_status", "published").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load related services: ${error.message}`);
  return (data ?? []) as ServiceOfferingCard[];
}

export async function getServiceOfferingsForModeration() {
  const { data, error } = await getAdminClient().from("service_offerings").select("id, slug, title, category, directory_entry_id, moderation_status, created_at").order("updated_at", { ascending: false }).limit(24);
  if (error) throw new Error(`Could not load service moderation queue: ${error.message}`);
  return (data ?? []) as ServiceModerationItem[];
}

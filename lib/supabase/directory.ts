import "server-only";
import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type DirectoryEntryRow = Database["public"]["Tables"]["directory_entries"]["Row"];

export type DirectoryEntryCard = Pick<
  DirectoryEntryRow,
  "id" | "slug" | "name" | "entry_type" | "category" | "description" | "city" | "state" | "service_area" | "image_path" | "moderation_status"
>;

export type DirectoryEntryDetail = DirectoryEntryCard & Pick<DirectoryEntryRow, "owner_id" | "website" | "email" | "phone" | "created_at" | "updated_at">;

export type DirectoryModerationEntry = Pick<
  DirectoryEntryRow,
  "id" | "slug" | "name" | "category" | "city" | "state" | "moderation_status" | "created_at"
>;

const directoryCardColumns = "id, slug, name, entry_type, category, description, city, state, service_area, image_path, moderation_status";
const directoryDetailColumns = `${directoryCardColumns}, owner_id, website, email, phone, created_at, updated_at`;
const directoryModerationColumns = "id, slug, name, category, city, state, moderation_status, created_at";

export function directoryLocation(entry: Pick<DirectoryEntryCard, "city" | "state" | "service_area">) {
  const location = `${entry.city}, ${entry.state}`;
  return entry.service_area ? `${location} · ${entry.service_area}` : location;
}

export async function getPublishedDirectoryEntries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_entries")
    .select(directoryCardColumns)
    .eq("moderation_status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load directory entries: ${error.message}`);
  return (data ?? []) as DirectoryEntryCard[];
}

export async function getPublishedDirectoryEntriesForCategory(category: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_entries")
    .select(directoryCardColumns)
    .eq("moderation_status", "published")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load ${category} directory entries: ${error.message}`);
  return (data ?? []) as DirectoryEntryCard[];
}

export async function getDirectoryEntryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_entries")
    .select(directoryDetailColumns)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Could not load this directory entry: ${error.message}`);
  return data as DirectoryEntryDetail | null;
}

export async function getDirectoryEntryById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_entries")
    .select(directoryDetailColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load this directory entry: ${error.message}`);
  return data as DirectoryEntryDetail | null;
}

export async function getDirectoryEntriesForOwner(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_entries")
    .select(directoryDetailColumns)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Could not load your directory entries: ${error.message}`);
  return (data ?? []) as DirectoryEntryDetail[];
}

export async function getDirectoryEntriesForModeration() {
  const { data, error } = await getAdminClient()
    .from("directory_entries")
    .select(directoryModerationColumns)
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) throw new Error(`Could not load the directory moderation queue: ${error.message}`);
  return (data ?? []) as DirectoryModerationEntry[];
}

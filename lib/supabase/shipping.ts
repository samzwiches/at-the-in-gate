import "server-only";

import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ShippingRouteRow = Database["public"]["Tables"]["shipping_routes"]["Row"];

export type ShippingRouteCard = Pick<ShippingRouteRow, "id" | "slug" | "directory_entry_id" | "title" | "origin" | "destination" | "availability_note" | "description" | "image_path" | "moderation_status">;
export type ShippingRouteDetail = ShippingRouteCard & Pick<ShippingRouteRow, "created_at" | "updated_at">;
export type ShippingModerationItem = Pick<ShippingRouteRow, "id" | "slug" | "title" | "directory_entry_id" | "moderation_status" | "created_at">;

const cardColumns = "id, slug, directory_entry_id, title, origin, destination, availability_note, description, image_path, moderation_status";
const detailColumns = `${cardColumns}, created_at, updated_at`;

export async function getPublishedShippingRoutes() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shipping_routes").select(cardColumns).eq("moderation_status", "published").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load shipping routes: ${error.message}`);
  return (data ?? []) as ShippingRouteCard[];
}

export async function getShippingRouteBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shipping_routes").select(detailColumns).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load this shipping route: ${error.message}`);
  return data as ShippingRouteDetail | null;
}

export async function getShippingRoutesForOwnerDirectoryEntries(directoryEntryIds: string[]) {
  if (directoryEntryIds.length === 0) return [] as ShippingRouteDetail[];
  const supabase = await createClient();
  const { data, error } = await supabase.from("shipping_routes").select(detailColumns).in("directory_entry_id", directoryEntryIds).order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load your shipping routes: ${error.message}`);
  return (data ?? []) as ShippingRouteDetail[];
}

export async function getPublishedShippingRoutesForDirectoryEntry(directoryEntryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shipping_routes").select(cardColumns).eq("directory_entry_id", directoryEntryId).eq("moderation_status", "published").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load related shipping routes: ${error.message}`);
  return (data ?? []) as ShippingRouteCard[];
}

export async function getShippingRoutesForModeration() {
  const { data, error } = await getAdminClient().from("shipping_routes").select("id, slug, title, directory_entry_id, moderation_status, created_at").order("updated_at", { ascending: false }).limit(24);
  if (error) throw new Error(`Could not load shipping route moderation queue: ${error.message}`);
  return (data ?? []) as ShippingModerationItem[];
}

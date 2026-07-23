import "server-only";
import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ShopItemRow = Database["public"]["Tables"]["shop_items"]["Row"];

export type ShopItemCard = Pick<
  ShopItemRow,
  "id" | "slug" | "title" | "description" | "category" | "image_path" | "price_label" | "seller_name" | "is_affiliate" | "moderation_status"
>;

export type ShopItemDetail = ShopItemCard & Pick<ShopItemRow, "owner_id" | "destination_url" | "created_at" | "updated_at">;

export type ShopModerationItem = Pick<
  ShopItemRow,
  "id" | "slug" | "title" | "category" | "seller_name" | "moderation_status" | "created_at"
>;

const shopCardColumns = "id, slug, title, description, category, image_path, price_label, seller_name, is_affiliate, moderation_status";
const shopDetailColumns = `${shopCardColumns}, owner_id, destination_url, created_at, updated_at`;
const shopModerationColumns = "id, slug, title, category, seller_name, moderation_status, created_at";

export async function getPublishedShopItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_items")
    .select(shopCardColumns)
    .eq("moderation_status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load shop items: ${error.message}`);
  return (data ?? []) as ShopItemCard[];
}

export async function getPublishedShopItemsForCategory(category: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_items")
    .select(shopCardColumns)
    .eq("moderation_status", "published")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load ${category} shop items: ${error.message}`);
  return (data ?? []) as ShopItemCard[];
}

export async function getShopItemBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_items")
    .select(shopDetailColumns)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Could not load this shop item: ${error.message}`);
  return data as ShopItemDetail | null;
}

export async function getShopItemsForOwner(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_items")
    .select(shopDetailColumns)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Could not load your shop items: ${error.message}`);
  return (data ?? []) as ShopItemDetail[];
}

export async function getShopItemsForModeration() {
  const { data, error } = await getAdminClient()
    .from("shop_items")
    .select(shopModerationColumns)
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) throw new Error(`Could not load the shop moderation queue: ${error.message}`);
  return (data ?? []) as ShopModerationItem[];
}

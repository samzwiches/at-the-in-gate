"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { shopCategories } from "@/lib/taxonomy";
import { createClient } from "@/lib/supabase/server";

type ShopPayload = {
  title: string;
  description: string;
  category: string;
  destination_url: string;
  seller_name: string;
  price_label: string | null;
  image_path: string | null;
  is_affiliate: boolean;
  moderation_status: "draft" | "pending";
};

type ShopPayloadResult = { payload: ShopPayload; error?: never } | { payload?: never; error: string };

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

function validDestination(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isShopCategory(category: string) {
  return shopCategories.some((item) => item.slug === category);
}

function revalidateShopPaths(slug?: string, category?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/mine");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  shopCategories.forEach((item) => revalidatePath(`/shop/category/${item.slug}`));
  if (slug) revalidatePath(`/shop/${slug}`);
  if (category) revalidatePath(`/shop/category/${category}`);
}

function shopPayload(formData: FormData): ShopPayloadResult {
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const destinationUrl = value(formData, "destinationUrl");
  const sellerName = value(formData, "sellerName");

  if (!title || !description || !category || !destinationUrl || !sellerName) {
    return { error: "Please complete every required shop field." as const };
  }

  if (!isShopCategory(category)) {
    return { error: "Choose a valid shop category." as const };
  }

  if (!validDestination(destinationUrl)) {
    return { error: "Use a full seller address beginning with http:// or https://." as const };
  }

  return {
    payload: {
      title,
      description,
      category,
      destination_url: destinationUrl,
      seller_name: sellerName,
      price_label: optionalValue(formData, "priceLabel"),
      image_path: optionalValue(formData, "imagePath"),
      is_affiliate: formData.get("isAffiliate") === "on",
      moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending",
    },
  };
}

export async function createShopItem(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  if (!user) return outcome("error", "Please sign in before adding a shop item.");

  const result = shopPayload(formData);
  if (!result.payload) return outcome("error", result.error ?? "Please check the shop details.");
  const payload = result.payload;

  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(payload.title);
  let { error } = await supabase.from("shop_items").insert({ ...payload, slug: baseSlug });

  if (error?.code === "23505") {
    ({ error } = await supabase
      .from("shop_items")
      .insert({ ...payload, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` }));
  }

  if (error) return outcome("error", "We could not save this shop item. Please check the details and try again.");

  revalidateShopPaths(undefined, payload.category);
  return outcome("success", payload.moderation_status === "draft" ? "Your shop draft has been saved." : "Your shop item has been sent for review.");
}

export async function updateShopItem(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const itemId = value(formData, "itemId");
  if (!user || !itemId) return outcome("error", "Please sign in before managing this shop item.");

  const result = shopPayload(formData);
  if (!result.payload) return outcome("error", result.error ?? "Please check the shop details.");
  const payload = result.payload;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_items")
    .update(payload)
    .eq("id", itemId)
    .eq("owner_id", user.id)
    .select("slug, category")
    .maybeSingle();

  if (error || !data) return outcome("error", "Only the item owner can update this entry.");

  revalidateShopPaths(data.slug, data.category);
  return outcome("success", payload.moderation_status === "draft" ? "Your shop draft has been updated." : "Your changes have been sent for review.");
}

export async function archiveShopItem(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const itemId = value(formData, "itemId");
  if (!user || !itemId) return outcome("error", "Please sign in before managing this shop item.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_items")
    .update({ moderation_status: "archived" })
    .eq("id", itemId)
    .eq("owner_id", user.id)
    .select("slug, category")
    .maybeSingle();

  if (error || !data) return outcome("error", "Only the item owner can archive this entry.");

  revalidateShopPaths(data.slug, data.category);
  return outcome("success", "Shop item archived.");
}

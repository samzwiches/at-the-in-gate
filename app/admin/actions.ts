"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/form-state";
import { requireAdministrator } from "@/lib/membership/require-active-membership";
import { getAdminClient } from "@/lib/supabase/admin";
import { directoryCategories, serviceCategories, shopCategories } from "@/lib/taxonomy";

type ModerationTarget = "directory" | "shop" | "service" | "shipping" | "review";
type ModerationIntent = "approve" | "reject" | "archive" | "restore";

function value(formData: FormData, key: string) { const field = formData.get(key); return typeof field === "string" ? field.trim() : ""; }
function outcome(status: FormActionState["status"], message: string): FormActionState { return { status, message }; }
function moderationStatus(intent: ModerationIntent) { return { approve: "published", reject: "rejected", archive: "archived", restore: "pending" }[intent]; }

function revalidateDirectory(slug: string, category: string) { ["/", "/directory", "/directory/mine", `/directory/${slug}`, `/directory/category/${category}`].forEach((path) => revalidatePath(path)); directoryCategories.forEach((item) => revalidatePath(`/directory/category/${item.slug}`)); }
function revalidateShop(slug: string, category: string) { ["/", "/shop", "/shop/mine", `/shop/${slug}`, `/shop/category/${category}`].forEach((path) => revalidatePath(path)); shopCategories.forEach((item) => revalidatePath(`/shop/category/${item.slug}`)); }
function revalidateShared() { ["/", "/admin", "/directory", "/services", "/services/mine", "/shippers", "/shippers/mine", "/reviews", "/reviews/mine", "/dashboard"].forEach((path) => revalidatePath(path)); serviceCategories.forEach((item) => revalidatePath(`/services/category/${item.slug}`)); }

async function moderate(target: ModerationTarget, _previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  await requireAdministrator("/admin");
  const recordId = value(formData, "recordId");
  const intent = value(formData, "intent") as ModerationIntent;
  if (!recordId || !["approve", "reject", "archive", "restore"].includes(intent)) return outcome("error", "Choose a valid moderation action.");
  const client = getAdminClient();
  const status = moderationStatus(intent);

  if (target === "directory") {
    const { data, error } = await client.from("directory_entries").update({ moderation_status: status }).eq("id", recordId).select("slug, category").maybeSingle();
    if (error || !data) return outcome("error", "We could not update that moderation status.");
    revalidateDirectory(data.slug, data.category);
  } else if (target === "shop") {
    const { data, error } = await client.from("shop_items").update({ moderation_status: status }).eq("id", recordId).select("slug, category").maybeSingle();
    if (error || !data) return outcome("error", "We could not update that moderation status.");
    revalidateShop(data.slug, data.category);
  } else if (target === "service") {
    const { data, error } = await client.from("service_offerings").update({ moderation_status: status }).eq("id", recordId).select("slug").maybeSingle();
    if (error || !data) return outcome("error", "We could not update that moderation status.");
    revalidatePath(`/services/${data.slug}`);
  } else if (target === "shipping") {
    const { data, error } = await client.from("shipping_routes").update({ moderation_status: status }).eq("id", recordId).select("slug").maybeSingle();
    if (error || !data) return outcome("error", "We could not update that moderation status.");
    revalidatePath(`/shippers/${data.slug}`);
  } else {
    const { error } = await client.from("reviews").update({ moderation_status: status }).eq("id", recordId);
    if (error) return outcome("error", "We could not update that moderation status.");
  }
  revalidateShared();
  return outcome("success", intent === "approve" ? "Published." : intent === "restore" ? "Returned to review." : intent === "reject" ? "Marked as rejected." : "Archived.");
}

export async function moderateDirectoryEntry(previousState: FormActionState, formData: FormData) { return moderate("directory", previousState, formData); }
export async function moderateShopItem(previousState: FormActionState, formData: FormData) { return moderate("shop", previousState, formData); }
export async function moderateServiceOffering(previousState: FormActionState, formData: FormData) { return moderate("service", previousState, formData); }
export async function moderateShippingRoute(previousState: FormActionState, formData: FormData) { return moderate("shipping", previousState, formData); }
export async function moderateReview(previousState: FormActionState, formData: FormData) { return moderate("review", previousState, formData); }

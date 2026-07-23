"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) { const field = formData.get(key); return typeof field === "string" ? field.trim() : ""; }
function optionalValue(formData: FormData, key: string) { return value(formData, key) || null; }
function outcome(status: FormActionState["status"], message: string): FormActionState { return { status, message }; }
type ShippingRoutePayload = Pick<Database["public"]["Tables"]["shipping_routes"]["Insert"], "directory_entry_id" | "title" | "origin" | "destination" | "description" | "availability_note" | "image_path" | "moderation_status">;

function payload(formData: FormData): { error: string } | { payload: ShippingRoutePayload } {
  const directoryEntryId = value(formData, "directoryEntryId");
  const title = value(formData, "title");
  const origin = value(formData, "origin");
  const destination = value(formData, "destination");
  const description = value(formData, "description");
  if (!directoryEntryId || !title || !origin || !destination || !description) return { error: "Please complete every required shipping route field." as const };
  return { payload: { directory_entry_id: directoryEntryId, title, origin, destination, description, availability_note: optionalValue(formData, "availabilityNote"), image_path: optionalValue(formData, "imagePath"), moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending" } };
}

function revalidateShippers(slug?: string) { ["/", "/shippers", "/shippers/mine", "/directory", "/dashboard", "/admin"].forEach((path) => revalidatePath(path)); if (slug) revalidatePath(`/shippers/${slug}`); }

export async function createShippingRoute(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  if (!user) return outcome("error", "Please sign in before adding a shipping route.");
  const result = payload(formData);
  if (!("payload" in result)) return outcome("error", result.error);
  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(result.payload.title);
  let { error } = await supabase.from("shipping_routes").insert({ ...result.payload, slug: baseSlug });
  if (error?.code === "23505") ({ error } = await supabase.from("shipping_routes").insert({ ...result.payload, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` }));
  if (error) return outcome("error", "We could not save this route. Choose one of your published shipper directory listings.");
  revalidateShippers();
  return outcome("success", result.payload.moderation_status === "draft" ? "Your route draft has been saved." : "Your route has been sent for review.");
}

export async function updateShippingRoute(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const routeId = value(formData, "routeId");
  if (!user || !routeId) return outcome("error", "Please sign in before managing this route.");
  const result = payload(formData);
  if (!("payload" in result)) return outcome("error", result.error);
  const supabase = await createClient();
  const { data, error } = await supabase.from("shipping_routes").update(result.payload).eq("id", routeId).select("slug").maybeSingle();
  if (error || !data) return outcome("error", "Only the shipper directory owner can update this route.");
  revalidateShippers(data.slug);
  return outcome("success", result.payload.moderation_status === "draft" ? "Your route draft has been updated." : "Your changes have been sent for review.");
}

export async function archiveShippingRoute(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const routeId = value(formData, "routeId");
  if (!user || !routeId) return outcome("error", "Please sign in before managing this route.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("shipping_routes").update({ moderation_status: "archived" }).eq("id", routeId).select("slug").maybeSingle();
  if (error || !data) return outcome("error", "Only the shipper directory owner can archive this route.");
  revalidateShippers(data.slug);
  return outcome("success", "Shipping route archived.");
}

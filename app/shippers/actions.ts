"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) { const field = formData.get(key); return typeof field === "string" ? field.trim() : ""; }
function optionalValue(formData: FormData, key: string) { return value(formData, key) || null; }
function outcome(status: FormActionState["status"], message: string): FormActionState { return { status, message }; }
function intValue(formData: FormData, key: string, fallback = 0) { const parsed = Number.parseInt(value(formData, key), 10); return Number.isFinite(parsed) ? parsed : fallback; }

type ShippingRoutePayload = {
  directory_entry_id: string;
  title: string;
  origin: string;
  destination: string;
  description: string;
  availability_note: string | null;
  image_path: string | null;
  moderation_status: "draft" | "pending";
  departure_date: string | null;
  return_date: string | null;
  total_capacity: number;
  booked_spots: number;
  route_status: "planning" | "open" | "nearly-full" | "full" | "departed" | "completed" | "cancelled";
  is_return_trip: boolean;
  stops: Array<{ location: string }>;
};

function payload(formData: FormData): { error: string } | { payload: ShippingRoutePayload } {
  const directoryEntryId = value(formData, "directoryEntryId");
  const title = value(formData, "title");
  const origin = value(formData, "origin");
  const destination = value(formData, "destination");
  const description = value(formData, "description");
  const totalCapacity = intValue(formData, "totalCapacity", 1);
  const bookedSpots = intValue(formData, "bookedSpots", 0);
  const routeStatusValue = value(formData, "routeStatus") || "planning";
  const allowedStatuses = new Set(["planning", "open", "nearly-full", "full", "departed", "completed", "cancelled"]);
  const stops = value(formData, "stops").split("\n").map((stop) => stop.trim()).filter(Boolean).slice(0, 20).map((location) => ({ location }));

  if (!directoryEntryId || !title || !origin || !destination || !description) return { error: "Please complete every required shipping route field." };
  if (totalCapacity < 1 || totalCapacity > 30) return { error: "Trailer capacity must be between 1 and 30 spaces." };
  if (bookedSpots < 0 || bookedSpots > totalCapacity) return { error: "Booked spaces cannot exceed total trailer capacity." };
  if (!allowedStatuses.has(routeStatusValue)) return { error: "Choose a valid route status." };

  return {
    payload: {
      directory_entry_id: directoryEntryId,
      title,
      origin,
      destination,
      description,
      availability_note: optionalValue(formData, "availabilityNote"),
      image_path: optionalValue(formData, "imagePath"),
      moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending",
      departure_date: optionalValue(formData, "departureDate"),
      return_date: optionalValue(formData, "returnDate"),
      total_capacity: totalCapacity,
      booked_spots: bookedSpots,
      route_status: routeStatusValue as ShippingRoutePayload["route_status"],
      is_return_trip: formData.get("isReturnTrip") === "on",
      stops,
    },
  };
}

function revalidateShippers(slug?: string) { ["/", "/shippers", "/shippers/mine", "/directory", "/dashboard", "/admin"].forEach((path) => revalidatePath(path)); if (slug) revalidatePath(`/shippers/${slug}`); }

export async function createShippingRoute(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  if (!user) return outcome("error", "Please sign in before adding a shipping route.");
  const result = payload(formData);
  if (!("payload" in result)) return outcome("error", result.error);
  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(result.payload.title);
  let { error } = await supabase.from("shipping_routes").insert({ ...result.payload, slug: baseSlug } as never);
  if (error?.code === "23505") ({ error } = await supabase.from("shipping_routes").insert({ ...result.payload, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` } as never));
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
  const { data, error } = await supabase.from("shipping_routes").update(result.payload as never).eq("id", routeId).select("slug").maybeSingle();
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

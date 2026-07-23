"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function optionalValue(formData: FormData, key: string) {
  return value(formData, key) || null;
}

function outcome(status: FormActionState["status"], message: string): FormActionState {
  return { status, message };
}

export async function createEvent(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return outcome("error", "Please sign in before submitting an event.");
  }

  const title = value(formData, "title");
  const venue = value(formData, "venue");
  const city = value(formData, "city");
  const state = value(formData, "state");
  const startDate = value(formData, "startDate");
  const endDate = value(formData, "endDate");
  const circuit = value(formData, "circuit");
  const description = value(formData, "description");
  const website = optionalValue(formData, "website");

  if (!title || !venue || !city || !state || !startDate || !endDate || !circuit || !description) {
    return outcome("error", "Please complete every required event field.");
  }

  if (endDate < startDate) {
    return outcome("error", "The end date must be on or after the start date.");
  }

  if (website) {
    try {
      const parsed = new URL(website);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Unsupported protocol");
      }
    } catch {
      return outcome("error", "Website links must begin with http:// or https://.");
    }
  }

  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(title);
  const payload = {
    title,
    venue,
    city,
    state,
    start_date: startDate,
    end_date: endDate,
    circuit,
    description,
    website,
    contact_details: optionalValue(formData, "contactDetails"),
    organizer_directory_entry_id: optionalValue(formData, "organizerDirectoryEntryId"),
    moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending",
  };
  let { error } = await supabase.from("events").insert({ ...payload, slug: baseSlug });

  if (error?.code === "23505") {
    ({ error } = await supabase.from("events").insert({
      ...payload,
      slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`,
    }));
  }

  if (error) {
    return outcome("error", "We could not save this event. Please check the details and try again.");
  }

  revalidatePath("/");
  revalidatePath("/events");
  return outcome("success", payload.moderation_status === "draft" ? "Your event draft has been saved." : "Your event has been sent for review.");
}

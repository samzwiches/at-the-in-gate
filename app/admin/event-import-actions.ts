"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/form-state";
import { requireAdministrator } from "@/lib/membership/require-active-membership";
import { uniqueSlugBase } from "@/lib/slug";
import { getEventImportAdminClient, type EventImport } from "@/lib/supabase/event-imports";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function outcome(status: FormActionState["status"], message: string): FormActionState {
  return { status, message };
}

function eventCircuit(item: EventImport) {
  if (item.affiliations.length) {
    return item.affiliations.join(" · ");
  }

  return item.zone ? `Ryegate Zone ${item.zone}` : "Ryegate Show Services";
}

function contactDetails(item: EventImport) {
  const values = [item.contact_name, item.contact_phone].filter(Boolean);
  return values.length ? values.join(" · ") : null;
}

function eventDescription(item: EventImport) {
  const zone = item.zone ? ` Listed by Ryegate for Zone ${item.zone}.` : "";
  const affiliations = item.affiliations.length
    ? ` Affiliations: ${item.affiliations.join(", ")}.`
    : "";

  return `Show information imported from Ryegate Show Services.${zone}${affiliations} Please confirm current details with show management before traveling.`;
}

async function loadImport(recordId: string) {
  const client = getEventImportAdminClient();
  const { data, error } = await client
    .from("event_imports")
    .select(
      "id, source, source_url, external_id, title, start_date, end_date, venue, city, state, zone, affiliations, contact_name, contact_phone, import_status, matched_event_id, first_seen_at, last_seen_at"
    )
    .eq("id", recordId)
    .maybeSingle();

  if (error || !data) {
    return { client, item: null };
  }

  return { client, item: data as EventImport };
}

export async function publishEventImport(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const { user } = await requireAdministrator("/admin");
  const recordId = field(formData, "recordId");

  if (!recordId) {
    return outcome("error", "That imported show could not be identified.");
  }

  const { client, item } = await loadImport(recordId);
  if (!item) {
    return outcome("error", "That imported show is no longer available.");
  }

  if (item.matched_event_id) {
    await client.from("event_imports").update({ import_status: "matched" }).eq("id", item.id);
    revalidatePath("/admin");
    return outcome("success", "This show is already connected to the calendar.");
  }

  const { data: existingEvent } = await client
    .from("events")
    .select("id, slug")
    .eq("title", item.title)
    .eq("start_date", item.start_date)
    .eq("end_date", item.end_date)
    .eq("state", item.state ?? "")
    .maybeSingle();

  if (existingEvent) {
    await client
      .from("event_imports")
      .update({ import_status: "matched", matched_event_id: existingEvent.id })
      .eq("title", item.title)
      .eq("start_date", item.start_date)
      .eq("end_date", item.end_date)
      .eq("state", item.state ?? "");

    revalidatePath("/admin");
    revalidatePath("/events");
    return outcome("success", "Matched to the show already on the calendar.");
  }

  const baseSlug = uniqueSlugBase(`${item.title}-${item.start_date}`);
  const payload = {
    owner_id: user.id,
    title: item.title,
    slug: baseSlug,
    venue: item.venue ?? "Venue to be confirmed",
    city: item.city ?? "Location to be confirmed",
    state: item.state ?? "NA",
    start_date: item.start_date,
    end_date: item.end_date,
    circuit: eventCircuit(item),
    description: eventDescription(item),
    website: item.source_url,
    contact_details: contactDetails(item),
    moderation_status: "published",
  };

  let { data: event, error } = await client
    .from("events")
    .insert(payload)
    .select("id, slug")
    .single();

  if (error?.code === "23505") {
    ({ data: event, error } = await client
      .from("events")
      .insert({ ...payload, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` })
      .select("id, slug")
      .single());
  }

  if (error || !event) {
    return outcome("error", `The show could not be published${error?.message ? `: ${error.message}` : "."}`);
  }

  const matchQuery = client
    .from("event_imports")
    .update({ import_status: "matched", matched_event_id: event.id })
    .eq("title", item.title)
    .eq("start_date", item.start_date)
    .eq("end_date", item.end_date);

  if (item.state) {
    await matchQuery.eq("state", item.state);
  } else {
    await matchQuery.is("state", null);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath(`/events/${event.slug}`);
  return outcome("success", "Published to the show calendar.");
}

export async function updateEventImportStatus(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireAdministrator("/admin");
  const recordId = field(formData, "recordId");
  const intent = field(formData, "intent");
  const statuses: Record<string, "new" | "rejected" | "ignored"> = {
    restore: "new",
    reject: "rejected",
    ignore: "ignored",
  };
  const status = statuses[intent];

  if (!recordId || !status) {
    return outcome("error", "Choose a valid import action.");
  }

  const client = getEventImportAdminClient();
  const { error } = await client
    .from("event_imports")
    .update({ import_status: status, matched_event_id: null })
    .eq("id", recordId);

  if (error) {
    return outcome("error", "The imported show could not be updated.");
  }

  revalidatePath("/admin");
  return outcome(
    "success",
    status === "new" ? "Returned to the review queue." : status === "rejected" ? "Rejected." : "Ignored."
  );
}

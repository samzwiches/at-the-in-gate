"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import { getMembershipForProfile } from "@/lib/membership/membership";
import type { FormActionState } from "@/lib/form-state";
import type { EventAttendanceStatus, EventUpdateType } from "@/lib/supabase/show-hub";
import { createClient } from "@/lib/supabase/server";

type ShowHubTables = Database["public"]["Tables"] & {
  event_attendance: {
    Row: { event_id: string; profile_id: string; status: EventAttendanceStatus; created_at: string; updated_at: string };
    Insert: { event_id: string; profile_id?: string; status: EventAttendanceStatus };
    Update: { status?: EventAttendanceStatus };
    Relationships: [];
  };
  event_updates: {
    Row: { id: string; event_id: string; author_id: string; update_type: EventUpdateType; body: string; moderation_status: string; created_at: string; updated_at: string };
    Insert: { event_id: string; author_id?: string; update_type?: EventUpdateType; body: string; moderation_status?: string };
    Update: { update_type?: EventUpdateType; body?: string; moderation_status?: string };
    Relationships: [];
  };
};

type ShowHubDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & { Tables: ShowHubTables };
};

const updateTypes: EventUpdateType[] = ["general", "ring", "shipping", "horse", "help", "vendor"];

function outcome(status: FormActionState["status"], message: string): FormActionState {
  return { status, message };
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function client() {
  return (await createClient()) as unknown as SupabaseClient<ShowHubDatabase>;
}

function revalidateShow(slug: string) {
  revalidatePath(`/events/show/${slug}`);
}

export async function setEventStatus(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();

  if (!user) return outcome("error", "Please sign in to follow a show or mark that you are going.");

  const eventId = field(formData, "eventId");
  const eventSlug = field(formData, "eventSlug");
  const requestedStatus = field(formData, "status");

  if (!eventId || !eventSlug || !["following", "going", "clear"].includes(requestedStatus)) {
    return outcome("error", "We could not update your show status.");
  }

  const supabase = await client();

  if (requestedStatus === "clear") {
    const { error } = await supabase
      .from("event_attendance")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", user.id);

    if (error) return outcome("error", "We could not clear your show status.");
    revalidateShow(eventSlug);
    return outcome("success", "Show status cleared.");
  }

  const status = requestedStatus as EventAttendanceStatus;
  const { error } = await supabase
    .from("event_attendance")
    .upsert({ event_id: eventId, profile_id: user.id, status }, { onConflict: "event_id,profile_id" });

  if (error) return outcome("error", "We could not update your show status.");

  revalidateShow(eventSlug);
  return outcome("success", status === "going" ? "You're going to this show." : "You're following this show.");
}

export async function createEventUpdate(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();

  if (!user) return outcome("error", "Please sign in to post an In Gate update.");

  const membership = await getMembershipForProfile(user.id).catch(() => null);
  if (!membership?.isEntitled) {
    return outcome("error", "An active membership is required to post In Gate updates.");
  }

  const eventId = field(formData, "eventId");
  const eventSlug = field(formData, "eventSlug");
  const body = field(formData, "body");
  const rawType = field(formData, "updateType");
  const updateType = updateTypes.includes(rawType as EventUpdateType) ? (rawType as EventUpdateType) : "general";

  if (!eventId || !eventSlug) return outcome("error", "This show is no longer available.");
  if (!body || body.length > 600) return outcome("error", "Updates must be between 1 and 600 characters.");

  const supabase = await client();
  const { error } = await supabase
    .from("event_updates")
    .insert({ event_id: eventId, author_id: user.id, update_type: updateType, body });

  if (error) return outcome("error", "We could not post that update. Please try again.");

  revalidateShow(eventSlug);
  return outcome("success", "Your update is now at the in gate.");
}

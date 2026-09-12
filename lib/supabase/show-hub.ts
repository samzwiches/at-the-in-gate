import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type EventAttendanceStatus = "following" | "going";
export type EventUpdateType = "general" | "ring" | "shipping" | "horse" | "help" | "vendor";

type BaseTables = Database["public"]["Tables"];

type EventAttendanceRow = {
  event_id: string;
  profile_id: string;
  status: EventAttendanceStatus;
  created_at: string;
  updated_at: string;
};

type EventUpdateRow = {
  id: string;
  event_id: string;
  author_id: string;
  update_type: EventUpdateType;
  body: string;
  moderation_status: string;
  created_at: string;
  updated_at: string;
};

type EventAttendanceTable = {
  Row: EventAttendanceRow;
  Insert: {
    event_id: string;
    profile_id?: string;
    status: EventAttendanceStatus;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<Pick<EventAttendanceRow, "status" | "updated_at">>;
  Relationships: [];
};

type EventUpdatesTable = {
  Row: EventUpdateRow;
  Insert: {
    id?: string;
    event_id: string;
    author_id?: string;
    update_type?: EventUpdateType;
    body: string;
    moderation_status?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<Pick<EventUpdateRow, "update_type" | "body" | "moderation_status" | "updated_at">>;
  Relationships: [];
};

type ShowHubDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: BaseTables & {
      event_attendance: EventAttendanceTable;
      event_updates: EventUpdatesTable;
    };
  };
};

export type ShowHubUpdate = EventUpdateRow & {
  authorName: string;
};

async function getClient() {
  return (await createClient()) as unknown as SupabaseClient<ShowHubDatabase>;
}

export async function getShowHubStats(eventId: string) {
  const supabase = await getClient();
  const [{ count: goingCount, error: goingError }, { count: followingCount, error: followingError }, { count: updateCount, error: updateError }] =
    await Promise.all([
      supabase.from("event_attendance").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "going"),
      supabase.from("event_attendance").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "following"),
      supabase.from("event_updates").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("moderation_status", "published"),
    ]);

  if (goingError || followingError || updateError) {
    return { goingCount: 0, followingCount: 0, updateCount: 0 };
  }

  return {
    goingCount: goingCount ?? 0,
    followingCount: followingCount ?? 0,
    updateCount: updateCount ?? 0,
  };
}

export async function getViewerEventStatus(eventId: string, profileId: string | null) {
  if (!profileId) return null;

  const supabase = await getClient();
  const { data, error } = await supabase
    .from("event_attendance")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) return null;
  return data?.status ?? null;
}

export async function getPublishedEventUpdates(eventId: string, limit = 8): Promise<ShowHubUpdate[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("event_updates")
    .select("id, event_id, author_id, update_type, body, moderation_status, created_at, updated_at")
    .eq("event_id", eventId)
    .eq("moderation_status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return [];

  const authorIds = [...new Set(data.map((update) => update.author_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", authorIds);

  const names = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.display_name?.trim() || profile.username?.trim() || "Member",
    ])
  );

  return data.map((update) => ({
    ...update,
    authorName: names.get(update.author_id) ?? "Member",
  }));
}

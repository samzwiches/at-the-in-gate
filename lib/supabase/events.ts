import "server-only";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type EventCard = Pick<
  EventRow,
  "id" | "slug" | "title" | "venue" | "city" | "state" | "start_date" | "end_date" | "circuit" | "description" | "website" | "organizer_directory_entry_id"
>;

const eventCardColumns = "id, slug, title, venue, city, state, start_date, end_date, circuit, description, website, organizer_directory_entry_id";
const eventDetailColumns = "id, slug, title, venue, city, state, start_date, end_date, circuit, description, website, contact_details, moderation_status, organizer_directory_entry_id, owner_id, created_at, updated_at";

export async function getPublishedEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(eventCardColumns)
    .eq("moderation_status", "published")
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(`Could not load events: ${error.message}`);
  }

  return (data ?? []) as EventCard[];
}

export async function getPublishedEventsForCircuit(circuit: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(eventCardColumns)
    .eq("moderation_status", "published")
    .eq("circuit", circuit)
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(`Could not load ${circuit} events: ${error.message}`);
  }

  return (data ?? []) as EventCard[];
}

export async function getEventBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(eventDetailColumns)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load this event: ${error.message}`);
  }

  return data as (Pick<EventRow, "id" | "slug" | "title" | "venue" | "city" | "state" | "start_date" | "end_date" | "circuit" | "description" | "website" | "contact_details" | "moderation_status" | "organizer_directory_entry_id" | "owner_id" | "created_at" | "updated_at">) | null;
}

export function formatEventDates(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  return startDate === endDate ? formatter.format(start) : `${formatter.format(start)} – ${formatter.format(end)}`;
}

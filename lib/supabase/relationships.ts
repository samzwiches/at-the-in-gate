import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  emptyListingRelationshipSelection,
  type ListingRelationshipSelection,
  type ListingRelationshipType,
  type RelationshipPickerOption,
} from "@/lib/relationships";
import { getPublishedListingsByIds, type ListingCard } from "@/lib/supabase/listings";
import { createClient } from "@/lib/supabase/server";

type RelationClient = SupabaseClient<Database>;

const directoryOptionColumns = "id, name, category";
const eventOptionColumns = "id, title";

export type ListingRelationshipDirectoryEntry = {
  relationship_type: ListingRelationshipType;
  id: string;
  slug: string;
  name: string;
  category: string;
  city: string;
  state: string;
};

export type ListingRelationshipEvent = {
  id: string;
  slug: string;
  title: string;
  start_date: string;
  end_date: string;
  venue: string;
  city: string;
  state: string;
};

export async function getPublishedRelationshipPickerData() {
  const supabase = await createClient();
  const [{ data: entries, error: entriesError }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from("directory_entries").select(directoryOptionColumns).eq("moderation_status", "published").order("name"),
    supabase.from("events").select(eventOptionColumns).eq("moderation_status", "published").order("start_date", { ascending: true }).order("title"),
  ]);

  if (entriesError) throw new Error(`Could not load directory choices: ${entriesError.message}`);
  if (eventsError) throw new Error(`Could not load event choices: ${eventsError.message}`);

  return {
    directoryEntries: (entries ?? []).map((entry) => ({ id: entry.id, name: entry.name, category: entry.category })) satisfies RelationshipPickerOption[],
    events: (events ?? []).map((event) => ({ id: event.id, name: event.title })) satisfies RelationshipPickerOption[],
  };
}

export async function getPublishedDirectoryEntryOptionsForOwner(ownerId: string, category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("directory_entries")
    .select(directoryOptionColumns)
    .eq("owner_id", ownerId)
    .eq("moderation_status", "published")
    .order("name");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load your directory choices: ${error.message}`);
  return (data ?? []).map((entry) => ({ id: entry.id, name: entry.name, category: entry.category })) satisfies RelationshipPickerOption[];
}

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

export function listingRelationshipSelectionFromFormData(formData: FormData): ListingRelationshipSelection {
  return {
    sellerDirectoryEntryId: value(formData, "sellerDirectoryEntryId"),
    trainerDirectoryEntryId: value(formData, "trainerDirectoryEntryId"),
    barnDirectoryEntryId: value(formData, "barnDirectoryEntryId"),
    shipperDirectoryEntryId: value(formData, "shipperDirectoryEntryId"),
    serviceProviderDirectoryEntryId: value(formData, "serviceProviderDirectoryEntryId"),
    eventId: value(formData, "eventId"),
  };
}

export async function getListingRelationshipSelection(listingId: string): Promise<ListingRelationshipSelection> {
  const supabase = await createClient();
  const [{ data: directoryRelationships, error: directoryError }, { data: eventRelationships, error: eventError }] = await Promise.all([
    supabase.from("listing_directory_relationships").select("relationship_type, directory_entry_id").eq("listing_id", listingId),
    supabase.from("listing_event_relationships").select("event_id").eq("listing_id", listingId).order("created_at", { ascending: true }).limit(1),
  ]);
  if (directoryError) throw new Error(`Could not load listing relationships: ${directoryError.message}`);
  if (eventError) throw new Error(`Could not load listing event relationship: ${eventError.message}`);

  const selection = { ...emptyListingRelationshipSelection };
  for (const relationship of directoryRelationships ?? []) {
    switch (relationship.relationship_type) {
      case "seller": selection.sellerDirectoryEntryId = relationship.directory_entry_id; break;
      case "trainer": selection.trainerDirectoryEntryId = relationship.directory_entry_id; break;
      case "barn": selection.barnDirectoryEntryId = relationship.directory_entry_id; break;
      case "shipper": selection.shipperDirectoryEntryId = relationship.directory_entry_id; break;
      case "service_provider": selection.serviceProviderDirectoryEntryId = relationship.directory_entry_id; break;
    }
  }
  selection.eventId = eventRelationships?.[0]?.event_id ?? null;
  return selection;
}

export async function replaceListingRelationships(
  supabase: RelationClient,
  listingId: string,
  selection: ListingRelationshipSelection
) {
  const { error: directoryDeleteError } = await supabase.from("listing_directory_relationships").delete().eq("listing_id", listingId);
  if (directoryDeleteError) throw new Error(directoryDeleteError.message);
  const { error: eventDeleteError } = await supabase.from("listing_event_relationships").delete().eq("listing_id", listingId);
  if (eventDeleteError) throw new Error(eventDeleteError.message);

  const relationships: Array<{ listing_id: string; directory_entry_id: string; relationship_type: ListingRelationshipType }> = [
    ["seller", selection.sellerDirectoryEntryId],
    ["trainer", selection.trainerDirectoryEntryId],
    ["barn", selection.barnDirectoryEntryId],
    ["shipper", selection.shipperDirectoryEntryId],
    ["service_provider", selection.serviceProviderDirectoryEntryId],
  ].flatMap(([relationshipType, directoryEntryId]) => directoryEntryId ? [{ listing_id: listingId, directory_entry_id: directoryEntryId, relationship_type: relationshipType as ListingRelationshipType }] : []);

  if (relationships.length > 0) {
    const { error } = await supabase.from("listing_directory_relationships").insert(relationships);
    if (error) throw new Error(error.message);
  }
  if (selection.eventId) {
    const { error } = await supabase.from("listing_event_relationships").insert({ listing_id: listingId, event_id: selection.eventId });
    if (error) throw new Error(error.message);
  }
}

export async function getDirectoryRelationshipsForListing(listingId: string) {
  const supabase = await createClient();
  const { data: relationships, error } = await supabase
    .from("listing_directory_relationships")
    .select("relationship_type, directory_entry_id")
    .eq("listing_id", listingId);
  if (error) throw new Error(`Could not load linked directory entries: ${error.message}`);
  const ids = (relationships ?? []).map((relationship) => relationship.directory_entry_id);
  if (ids.length === 0) return [] as ListingRelationshipDirectoryEntry[];
  const { data: entries, error: entriesError } = await supabase
    .from("directory_entries")
    .select("id, slug, name, category, city, state")
    .in("id", ids)
    .eq("moderation_status", "published");
  if (entriesError) throw new Error(`Could not load linked directory entries: ${entriesError.message}`);
  const byId = new Map((entries ?? []).map((entry) => [entry.id, entry]));
  return (relationships ?? []).flatMap((relationship) => {
    const entry = byId.get(relationship.directory_entry_id);
    return entry ? [{ ...entry, relationship_type: relationship.relationship_type as ListingRelationshipType }] : [];
  });
}

export async function getEventRelationshipsForListing(listingId: string) {
  const supabase = await createClient();
  const { data: relationships, error } = await supabase
    .from("listing_event_relationships")
    .select("event_id")
    .eq("listing_id", listingId);
  if (error) throw new Error(`Could not load linked events: ${error.message}`);
  const eventIds = (relationships ?? []).map((relationship) => relationship.event_id);
  if (eventIds.length === 0) return [] as ListingRelationshipEvent[];
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, slug, title, start_date, end_date, venue, city, state")
    .in("id", eventIds)
    .eq("moderation_status", "published")
    .order("start_date", { ascending: true });
  if (eventsError) throw new Error(`Could not load linked events: ${eventsError.message}`);
  return (events ?? []) as ListingRelationshipEvent[];
}

export async function getRelatedListingsForDirectoryEntry(directoryEntryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_directory_relationships")
    .select("listing_id, relationship_type")
    .eq("directory_entry_id", directoryEntryId);
  if (error) throw new Error(`Could not load related listings: ${error.message}`);
  const relationshipByListingId = new Map((data ?? []).map((relationship) => [relationship.listing_id, relationship.relationship_type as ListingRelationshipType]));
  const listings = await getPublishedListingsByIds([...relationshipByListingId.keys()]);
  return listings.map((listing) => ({ listing, relationshipType: relationshipByListingId.get(listing.id)! }));
}

export async function getRelatedListingsForEvent(eventId: string): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("listing_event_relationships").select("listing_id").eq("event_id", eventId);
  if (error) throw new Error(`Could not load related listings: ${error.message}`);
  return getPublishedListingsByIds((data ?? []).map((relationship) => relationship.listing_id));
}

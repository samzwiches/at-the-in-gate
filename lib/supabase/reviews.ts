import "server-only";

import type { Database } from "@/lib/database.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export type Review = Pick<
  ReviewRow,
  "id" | "author_id" | "directory_entry_id" | "listing_id" | "service_offering_id" | "shipping_route_id" | "event_id" | "rating" | "title" | "body" | "moderation_status" | "edited_at" | "deleted_at" | "created_at" | "updated_at"
>;

export type ReviewTarget =
  | { type: "directory_entry"; id: string }
  | { type: "listing"; id: string }
  | { type: "service_offering"; id: string }
  | { type: "shipping_route"; id: string }
  | { type: "event"; id: string };

const reviewColumns = "id, author_id, directory_entry_id, listing_id, service_offering_id, shipping_route_id, event_id, rating, title, body, moderation_status, edited_at, deleted_at, created_at, updated_at";

export function reviewTargetFromRow(review: Pick<Review, "directory_entry_id" | "listing_id" | "service_offering_id" | "shipping_route_id" | "event_id">): ReviewTarget | null {
  if (review.directory_entry_id) return { type: "directory_entry", id: review.directory_entry_id };
  if (review.listing_id) return { type: "listing", id: review.listing_id };
  if (review.service_offering_id) return { type: "service_offering", id: review.service_offering_id };
  if (review.shipping_route_id) return { type: "shipping_route", id: review.shipping_route_id };
  if (review.event_id) return { type: "event", id: review.event_id };
  return null;
}

export async function getPublishedReviews(limit = 24) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select(reviewColumns).eq("moderation_status", "published").is("deleted_at", null).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Could not load reviews: ${error.message}`);
  return (data ?? []) as Review[];
}

export async function getPublishedReviewsForTarget(target: ReviewTarget) {
  const supabase = await createClient();
  const column = {
    directory_entry: "directory_entry_id",
    listing: "listing_id",
    service_offering: "service_offering_id",
    shipping_route: "shipping_route_id",
    event: "event_id",
  }[target.type];
  const { data, error } = await supabase.from("reviews").select(reviewColumns).eq(column, target.id).eq("moderation_status", "published").is("deleted_at", null).order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load reviews: ${error.message}`);
  return (data ?? []) as Review[];
}

export async function getReviewsForAuthor(authorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select(reviewColumns).eq("author_id", authorId).order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load your reviews: ${error.message}`);
  return (data ?? []) as Review[];
}

export async function getReviewForAuthor(reviewId: string, authorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select(reviewColumns).eq("id", reviewId).eq("author_id", authorId).maybeSingle();
  if (error) throw new Error(`Could not load this review: ${error.message}`);
  return data as Review | null;
}

export async function getReviewsForModeration() {
  const { data, error } = await getAdminClient().from("reviews").select(reviewColumns).order("updated_at", { ascending: false }).limit(24);
  if (error) throw new Error(`Could not load the review moderation queue: ${error.message}`);
  return (data ?? []) as Review[];
}

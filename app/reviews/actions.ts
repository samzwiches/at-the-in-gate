"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import type { FormActionState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

type TargetType = "directory_entry" | "listing" | "service_offering" | "shipping_route" | "event";
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewTargetColumn = "directory_entry_id" | "listing_id" | "service_offering_id" | "shipping_route_id" | "event_id";
type ReviewDraft = Pick<ReviewInsert, "rating" | "title" | "body" | "moderation_status">;
const targetColumns: Record<TargetType, ReviewTargetColumn> = { directory_entry: "directory_entry_id", listing: "listing_id", service_offering: "service_offering_id", shipping_route: "shipping_route_id", event: "event_id" };

function value(formData: FormData, key: string) { const field = formData.get(key); return typeof field === "string" ? field.trim() : ""; }
function outcome(status: FormActionState["status"], message: string): FormActionState { return { status, message }; }
function revalidateReviews() { ["/reviews", "/reviews/mine", "/directory", "/marketplace", "/services", "/shippers", "/events", "/admin"].forEach((path) => revalidatePath(path)); }

function reviewPayload(formData: FormData): { error: string } | { payload: ReviewDraft } {
  const rating = Number(value(formData, "rating"));
  const body = value(formData, "body");
  const title = value(formData, "title") || null;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !body) return { error: "Choose a rating and share a clear, specific note." as const };
  return { payload: { rating, title, body, moderation_status: value(formData, "intent") === "draft" ? "draft" : "pending" } };
}

export async function createReview(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const targetType = value(formData, "targetType") as TargetType;
  const targetId = value(formData, "targetId");
  if (!user) return outcome("error", "Please sign in before writing a review.");
  if (!(targetType in targetColumns) || !targetId) return outcome("error", "Choose a valid published record to review.");
  const parsed = reviewPayload(formData);
  if (!("payload" in parsed)) return outcome("error", parsed.error);
  const supabase = await createClient();
  const review: ReviewInsert = { ...parsed.payload };
  review[targetColumns[targetType]] = targetId;
  const { error } = await supabase.from("reviews").insert(review);
  if (error?.code === "23505") return outcome("error", "You already have an active review for this record. Edit or archive it from My reviews.");
  if (error) return outcome("error", "We could not save that review. Confirm the record is public and that you are not reviewing your own listing.");
  revalidateReviews();
  return outcome("success", parsed.payload.moderation_status === "draft" ? "Your review draft has been saved." : "Your review has been sent for moderation.");
}

export async function updateReview(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const reviewId = value(formData, "reviewId");
  if (!user || !reviewId) return outcome("error", "Please sign in before managing this review.");
  const parsed = reviewPayload(formData);
  if (!("payload" in parsed)) return outcome("error", parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").update(parsed.payload).eq("id", reviewId).eq("author_id", user.id);
  if (error) return outcome("error", "Only the review author can update this review.");
  revalidateReviews();
  return outcome("success", parsed.payload.moderation_status === "draft" ? "Your review draft has been updated." : "Your changes have been sent for moderation.");
}

export async function archiveReview(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const reviewId = value(formData, "reviewId");
  if (!user || !reviewId) return outcome("error", "Please sign in before managing this review.");
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").update({ deleted_at: new Date().toISOString() }).eq("id", reviewId).eq("author_id", user.id);
  if (error) return outcome("error", "Only the review author can archive this review.");
  revalidateReviews();
  return outcome("success", "Review archived.");
}

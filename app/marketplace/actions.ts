"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/form-state";
import { uniqueSlugBase } from "@/lib/slug";
import { listingRelationshipSelectionFromFormData, replaceListingRelationships } from "@/lib/supabase/relationships";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function optionalValue(formData: FormData, key: string) {
  return value(formData, key) || null;
}

function failure(message: string): FormActionState {
  return { status: "error", message };
}

function success(message: string): FormActionState {
  return { status: "success", message };
}

function listingIntent(formData: FormData) {
  const intent = value(formData, "intent");
  return intent === "draft" ? "draft" : "pending";
}

export async function createListing(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return failure("Please sign in before adding a listing.");
  }

  const horseName = value(formData, "horseName");
  const listingType = value(formData, "listingType");
  const division = value(formData, "division");
  const location = value(formData, "location");
  const priceText = value(formData, "priceText");
  const description = value(formData, "description");
  const ageValue = value(formData, "age");
  const age = ageValue === "" ? null : Number(ageValue);

  if (!horseName || !division || !location || !priceText || !description) {
    return failure("Please complete the horse, division, location, price, and description fields.");
  }

  if (!['for_sale', 'lease', 'sale_or_lease'].includes(listingType)) {
    return failure("Choose whether this listing is for sale, lease, or both.");
  }

  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 40)) {
    return failure("Age must be a whole number between 0 and 40.");
  }

  const supabase = await createClient();
  const baseSlug = uniqueSlugBase(horseName);
  const payload = {
    title: horseName,
    horse_name: horseName,
    listing_type: listingType,
    division,
    location,
    price_text: priceText,
    description,
    age,
    height_text: optionalValue(formData, "heightText"),
    breed: optionalValue(formData, "breed"),
    sex: optionalValue(formData, "sex"),
    status: "draft",
  };

  let { data, error } = await supabase.from("listings").insert({ ...payload, slug: baseSlug }).select("id, slug").maybeSingle();

  if (error?.code === "23505") {
    ({ data, error } = await supabase.from("listings").insert({
      ...payload,
      slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`,
    }).select("id, slug").maybeSingle());
  }

  if (error || !data) {
    return failure("We could not save this listing. Please check the details and try again.");
  }

  try {
    await replaceListingRelationships(supabase, data.id, listingRelationshipSelectionFromFormData(formData));
  } catch {
    return failure("Your listing details were saved, but the linked records could not be saved. Edit the listing and try those links again.");
  }

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/my-listings");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: listingIntent(formData) === "draft" ? "Your listing draft has been saved." : "Your listing details are saved. Adding photos before review.",
    listingId: data.id,
    slug: data.slug,
    reviewRequested: listingIntent(formData) === "pending",
    submissionId: crypto.randomUUID(),
  };
}

export async function archiveListing(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const listingId = value(formData, "listingId");

  if (!user || !listingId) {
    return failure("Please sign in before managing this listing.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "archived" })
    .eq("id", listingId)
    .select("slug")
    .maybeSingle();

  if (error || !data) {
    return failure("Only the listing owner can archive this entry.");
  }

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/my-listings");
  revalidatePath(`/marketplace/${data.slug}`);
  revalidatePath("/dashboard");
  return success("Listing archived.");
}

export async function markListingSold(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const listingId = value(formData, "listingId");

  if (!user || !listingId) {
    return failure("Please sign in before managing this listing.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", listingId)
    .select("slug")
    .maybeSingle();

  if (error || !data) {
    return failure("Only the listing owner can mark this entry as sold.");
  }

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/my-listings");
  revalidatePath(`/marketplace/${data.slug}`);
  revalidatePath("/dashboard");
  return success("Listing marked as sold.");
}

export async function updateListing(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  const listingId = value(formData, "listingId");
  const horseName = value(formData, "horseName");
  const listingType = value(formData, "listingType");
  const division = value(formData, "division");
  const location = value(formData, "location");
  const priceText = value(formData, "priceText");
  const description = value(formData, "description");
  const ageValue = value(formData, "age");
  const age = ageValue === "" ? null : Number(ageValue);

  if (!user || !listingId) {
    return failure("Please sign in before managing this listing.");
  }

  if (!horseName || !division || !location || !priceText || !description) {
    return failure("Please complete the horse, division, location, price, and description fields.");
  }

  if (!["for_sale", "lease", "sale_or_lease"].includes(listingType)) {
    return failure("Choose whether this listing is for sale, lease, or both.");
  }

  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 40)) {
    return failure("Age must be a whole number between 0 and 40.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({
      title: horseName,
      horse_name: horseName,
      listing_type: listingType,
      division,
      location,
      price_text: priceText,
      description,
      age,
      height_text: optionalValue(formData, "heightText"),
      breed: optionalValue(formData, "breed"),
      sex: optionalValue(formData, "sex"),
      status: "draft",
    })
    .eq("id", listingId)
    .select("id, slug")
    .maybeSingle();

  if (error || !data) {
    return failure("Only the listing owner can update this entry.");
  }

  try {
    await replaceListingRelationships(supabase, data.id, listingRelationshipSelectionFromFormData(formData));
  } catch {
    return failure("Your listing details were saved, but the linked records could not be saved. Edit the listing and try those links again.");
  }

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/my-listings");
  revalidatePath(`/marketplace/${data.slug}`);
  revalidatePath(`/marketplace/${data.slug}/edit`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: listingIntent(formData) === "draft" ? "Your listing draft has been updated." : "Your changes are saved. Adding photos before review.",
    listingId: data.id,
    slug: data.slug,
    reviewRequested: listingIntent(formData) === "pending",
    submissionId: crypto.randomUUID(),
  };
}

export async function submitListingForReview(listingId: string): Promise<FormActionState> {
  const user = await getAuthenticatedUser();
  if (!user || !listingId) return failure("Please sign in before sending this listing for review.");

  const supabase = await createClient();
  const { count, error: imageError } = await supabase
    .from("listing_images")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("owner_id", user.id);
  if (imageError) return failure("We could not check the listing photos.");
  if ((count ?? 0) < 1) return failure("Add at least one photo before sending this listing for review.");

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "pending" })
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .select("slug")
    .maybeSingle();
  if (error || !data) return failure("Only the listing owner can send this entry for review.");

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/my-listings");
  revalidatePath(`/marketplace/${data.slug}`);
  revalidatePath(`/marketplace/${data.slug}/edit`);
  revalidatePath("/dashboard");
  return success("Your listing has been sent for review.");
}

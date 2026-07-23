import "server-only";
import type { Database } from "@/lib/database.types";
import { LISTING_IMAGE_BUCKET } from "@/lib/listing-images";
import { createClient } from "@/lib/supabase/server";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ListingImageRow = Database["public"]["Tables"]["listing_images"]["Row"];
type ListingVideoRow = Database["public"]["Tables"]["listing_videos"]["Row"];

type ListingImageData = Pick<ListingImageRow, "id" | "listing_id" | "storage_path" | "alt_text" | "focal_x" | "focal_y" | "sort_order" | "is_primary" | "created_at">;

export type ListingImage = ListingImageData & {
  signedUrl: string | null;
};

export type ListingVideo = Pick<ListingVideoRow, "id" | "listing_id" | "provider" | "video_url" | "provider_video_id" | "title" | "sort_order" | "created_at">;

type ListingCardRow = Pick<
  ListingRow,
  "id" | "slug" | "horse_name" | "division" | "location" | "price_text" | "listing_type" | "status" | "age" | "height_text" | "breed" | "sex" | "is_featured"
>;

export type ListingCard = ListingCardRow & { primaryImage: ListingImage | null };

export type ListingFilters = {
  category?: string;
  division?: string;
  listingType?: string;
};

const listingCardColumns = "id, slug, horse_name, division, location, price_text, listing_type, status, age, height_text, breed, sex, is_featured";
const listingDetailColumns = "id, slug, horse_name, division, location, price_text, listing_type, status, image_path, image_alt_text, image_focal_position, age, height_text, breed, sex, is_featured, description, title, owner_id, created_at, updated_at";
const listingImageColumns = "id, listing_id, storage_path, alt_text, focal_x, focal_y, sort_order, is_primary, created_at";
const listingVideoColumns = "id, listing_id, provider, video_url, provider_video_id, title, sort_order, created_at";

const listingTypeLabels: Record<string, string> = {
  for_sale: "For sale",
  lease: "Lease",
  sale_or_lease: "Sale or lease",
};

export function formatListingType(value: string) {
  return listingTypeLabels[value] ?? value.replaceAll("_", " ");
}

export function listingDetails(listing: Pick<ListingCardRow, "age" | "breed" | "sex" | "height_text">) {
  const horseDetails = [
    listing.age === null ? null : `${listing.age} yr`,
    listing.breed,
    listing.sex,
  ].filter(Boolean).join(" ");

  return [horseDetails, listing.height_text].filter(Boolean).join(" · ") || "Details available on request";
}

function matchesDivision(listing: ListingCardRow, division: string) {
  const value = listing.division.toLowerCase();

  switch (division) {
    case "hunters": return value.includes("hunter") && !value.includes("pony");
    case "jumpers": return value.includes("jumper");
    case "equitation": return value.includes("equitation") || value.includes("eq");
    case "ponies": return value.includes("pony");
    default: return true;
  }
}

async function addSignedUrls(supabase: Awaited<ReturnType<typeof createClient>>, images: ListingImageData[]) {
  if (images.length === 0) return [] as ListingImage[];

  const { data, error } = await supabase.storage
    .from(LISTING_IMAGE_BUCKET)
    .createSignedUrls(images.map((image) => image.storage_path), 300);
  if (error) return images.map((image) => ({ ...image, signedUrl: null }));

  const signedByPath = new Map((data ?? []).map((item) => [item.path, item.signedUrl]));
  return images.map((image) => ({ ...image, signedUrl: signedByPath.get(image.storage_path) ?? null }));
}

async function addPrimaryImages(supabase: Awaited<ReturnType<typeof createClient>>, listings: ListingCardRow[]) {
  if (listings.length === 0) return [] as ListingCard[];
  const listingIds = listings.map((listing) => listing.id);
  const { data, error } = await supabase
    .from("listing_images")
    .select(listingImageColumns)
    .in("listing_id", listingIds)
    .eq("is_primary", true);
  if (error) throw new Error(`Could not load marketplace images: ${error.message}`);

  const images = await addSignedUrls(supabase, (data ?? []) as ListingImageData[]);
  const imageByListingId = new Map(images.map((image) => [image.listing_id, image]));
  return listings.map((listing) => ({ ...listing, primaryImage: imageByListingId.get(listing.id) ?? null }));
}

export async function getPublishedListings(filters: ListingFilters = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(listingCardColumns)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load marketplace listings: ${error.message}`);

  let listings = (data ?? []) as ListingCardRow[];
  if (filters.category && filters.category !== "horses-and-ponies") listings = [];
  if (filters.division) listings = listings.filter((listing) => matchesDivision(listing, filters.division!));
  if (filters.listingType) listings = listings.filter((listing) => listing.listing_type === filters.listingType);

  return addPrimaryImages(supabase, listings);
}

export async function getPublishedListingsByIds(listingIds: string[]) {
  if (listingIds.length === 0) return [] as ListingCard[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(listingCardColumns)
    .in("id", listingIds)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load related marketplace listings: ${error.message}`);
  return addPrimaryImages(supabase, (data ?? []) as ListingCardRow[]);
}

export async function getListingBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("listings").select(listingDetailColumns).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load this listing: ${error.message}`);
  return data as (Pick<ListingRow, "id" | "slug" | "horse_name" | "division" | "location" | "price_text" | "listing_type" | "status" | "image_path" | "image_alt_text" | "image_focal_position" | "age" | "height_text" | "breed" | "sex" | "is_featured" | "description" | "title" | "owner_id" | "created_at" | "updated_at">) | null;
}

export async function getListingImages(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_images")
    .select(listingImageColumns)
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load listing images: ${error.message}`);
  return addSignedUrls(supabase, (data ?? []) as ListingImageData[]);
}

export async function getListingVideos(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_videos")
    .select(listingVideoColumns)
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load listing videos: ${error.message}`);
  return (data ?? []) as ListingVideo[];
}

export async function getListingsForOwner(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("listings").select(listingCardColumns).eq("owner_id", ownerId).order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load your listings: ${error.message}`);
  return (data ?? []) as ListingCardRow[];
}

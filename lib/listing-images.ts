export const LISTING_IMAGE_BUCKET = "listing-images";
export const MAX_LISTING_IMAGE_BYTES = 6 * 1024 * 1024;
export const MAX_LISTING_IMAGE_LABEL = "6 MB";
export const ACCEPTED_LISTING_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isAcceptedListingImageType(type: string): type is (typeof ACCEPTED_LISTING_IMAGE_TYPES)[number] {
  return (ACCEPTED_LISTING_IMAGE_TYPES as readonly string[]).includes(type);
}

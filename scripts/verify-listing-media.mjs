import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const statePath = "/tmp/at-the-in-gate-listing-media-qa.json";
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3002";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !publishableKey || !serviceRoleKey) throw new Error("Required Supabase environment variables are missing.");
if (existsSync(statePath)) throw new Error(`QA state already exists at ${statePath}. Clean it up before running another media verification.`);

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `Qa!media-${crypto.randomUUID()}a`;
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clientFor(accessToken) {
  return createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cookieFor(session) {
  return {
    name: `sb-${projectRef}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
  };
}

async function createQaUser(label) {
  const email = `qa-listing-media-${label}-${suffix}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`Could not create ${label} QA user: ${error?.message ?? "unknown error"}`);
  const signingIn = createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signedIn, error: signInError } = await signingIn.auth.signInWithPassword({ email, password });
  if (signInError || !signedIn.session) throw new Error(`Could not sign in ${label} QA user: ${signInError?.message ?? "unknown error"}`);
  return { id: data.user.id, email, session: signedIn.session, client: clientFor(signedIn.session.access_token) };
}

async function requestAs(session, path, init = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Cookie: `${cookieFor(session).name}=${cookieFor(session).value}`, ...(init.headers ?? {}) },
  });
}

function tinyPng() {
  return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M/wHwAF/gL+AyNixQAAAABJRU5ErkJggg==", "base64");
}

function imageForm(altText, focalX, focalY) {
  const body = new FormData();
  body.append("image", new File([tinyPng()], "qa-crop.png", { type: "image/png" }));
  body.append("altText", altText);
  body.append("focalX", String(focalX));
  body.append("focalY", String(focalY));
  return body;
}

const owner = await createQaUser("owner");
const other = await createQaUser("other");

const slug = `qa-listing-media-${suffix}`;
const { data: listing, error: listingError } = await owner.client
  .from("listings")
  .insert({
    title: "QA media listing",
    slug,
    horse_name: "QA Media Pony",
    listing_type: "for_sale",
    division: "Hunters",
    location: "QA Barn, NY",
    price_text: "$1",
    description: "Temporary verification listing for media ownership and rendering.",
  })
  .select("id, slug, status")
  .single();
if (listingError || !listing) throw new Error(`Could not create QA listing: ${listingError?.message ?? "unknown error"}`);

const firstImageResponse = await requestAs(owner.session, `/api/listings/${listing.id}/images`, { method: "POST", body: imageForm("QA crop framing", 42, 28) });
assert(firstImageResponse.status === 201, `Owner image upload failed with ${firstImageResponse.status}.`);
const { image: firstImage } = await firstImageResponse.json();
assert(firstImage.focal_x === 42 && firstImage.focal_y === 28, "Image upload did not persist its focal point.");

const invalidFocalResponse = await requestAs(owner.session, `/api/listings/${listing.id}/images`, { method: "POST", body: imageForm("Invalid focal point", 101, 50) });
assert(invalidFocalResponse.status === 400, `Out-of-range focal point was not rejected (${invalidFocalResponse.status}).`);

const secondImageResponse = await requestAs(owner.session, `/api/listings/${listing.id}/images`, { method: "POST", body: imageForm("Second QA crop", 58, 62) });
assert(secondImageResponse.status === 201, `Second owner image upload failed with ${secondImageResponse.status}.`);
const { image: secondImage } = await secondImageResponse.json();

const metadataResponse = await requestAs(owner.session, `/api/listings/${listing.id}/images`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageId: firstImage.id, operation: "metadata", altText: "Updated QA crop framing", focalX: 42, focalY: 28 }),
});
assert(metadataResponse.status === 200, `Owner focal/alt update failed with ${metadataResponse.status}.`);

const primaryResponse = await requestAs(owner.session, `/api/listings/${listing.id}/images`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageId: secondImage.id, operation: "primary" }),
});
assert(primaryResponse.status === 200, `Primary image selection failed with ${primaryResponse.status}.`);

const imageReorderResponse = await requestAs(owner.session, `/api/listings/${listing.id}/images`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageId: secondImage.id, operation: "up" }),
});
assert(imageReorderResponse.status === 200, `Image reorder failed with ${imageReorderResponse.status}.`);

const { data: ownerImages, error: ownerImagesError } = await owner.client
  .from("listing_images")
  .select("id, focal_x, focal_y, alt_text, is_primary, sort_order")
  .eq("listing_id", listing.id)
  .order("sort_order");
assert(!ownerImagesError && ownerImages?.length === 2, "Owner could not read both draft images.");
assert(ownerImages.some((image) => image.id === firstImage.id && image.focal_x === 42 && image.focal_y === 28 && image.alt_text === "Updated QA crop framing"), "Updated focal point or alt text did not persist.");
assert(ownerImages.filter((image) => image.is_primary).length === 1 && ownerImages.find((image) => image.is_primary)?.id === secondImage.id, "Primary-image invariant was not preserved.");

const videoResponse = await requestAs(owner.session, `/api/listings/${listing.id}/videos`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "QA YouTube ride" }),
});
assert(videoResponse.status === 201, `YouTube video add failed with ${videoResponse.status}.`);
const { video: youtubeVideo } = await videoResponse.json();
assert(youtubeVideo.provider === "youtube" && youtubeVideo.provider_video_id === "dQw4w9WgXcQ", "YouTube provider or ID was not derived server-side.");

const vimeoResponse = await requestAs(owner.session, `/api/listings/${listing.id}/videos`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ videoUrl: "https://vimeo.com/123456789", title: "QA Vimeo ride" }),
});
assert(vimeoResponse.status === 201, `Vimeo video add failed with ${vimeoResponse.status}.`);
const { video: vimeoVideo } = await vimeoResponse.json();
assert(vimeoVideo.provider === "vimeo" && vimeoVideo.provider_video_id === "123456789", "Vimeo provider or ID was not derived server-side.");

const invalidVideoResponse = await requestAs(owner.session, `/api/listings/${listing.id}/videos`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ videoUrl: "https://example.com/not-a-video", title: "Invalid" }),
});
assert(invalidVideoResponse.status === 400, `Invalid video URL was not rejected (${invalidVideoResponse.status}).`);

const videoDetailsResponse = await requestAs(owner.session, `/api/listings/${listing.id}/videos`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ videoId: youtubeVideo.id, operation: "details", title: "Updated QA YouTube ride" }),
});
assert(videoDetailsResponse.status === 200, `Video title update failed with ${videoDetailsResponse.status}.`);

const videoReorderResponse = await requestAs(owner.session, `/api/listings/${listing.id}/videos`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ videoId: vimeoVideo.id, operation: "up" }),
});
assert(videoReorderResponse.status === 200, `Video reorder failed with ${videoReorderResponse.status}.`);

const removeVideoResponse = await requestAs(owner.session, `/api/listings/${listing.id}/videos?videoId=${encodeURIComponent(vimeoVideo.id)}`, { method: "DELETE" });
assert(removeVideoResponse.status === 200, `Video removal failed with ${removeVideoResponse.status}.`);

const crossOwnerImageResponse = await requestAs(other.session, `/api/listings/${listing.id}/images`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageId: firstImage.id, operation: "metadata", focalX: 1, focalY: 1 }),
});
assert(crossOwnerImageResponse.status === 403, `Cross-owner image update was not denied (${crossOwnerImageResponse.status}).`);

const crossOwnerVideoResponse = await requestAs(other.session, `/api/listings/${listing.id}/videos`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ videoUrl: "https://youtu.be/dQw4w9WgXcQ", title: "Unauthorized" }),
});
assert(crossOwnerVideoResponse.status === 403, `Cross-owner video add was not denied (${crossOwnerVideoResponse.status}).`);

const { error: directCrossOwnerVideoError } = await other.client.from("listing_videos").insert({
  listing_id: listing.id,
  owner_id: other.id,
  provider: "youtube",
  provider_video_id: "dQw4w9WgXcQ",
  video_url: "https://youtu.be/dQw4w9WgXcQ",
  title: "Unauthorized direct write",
});
assert(directCrossOwnerVideoError, "Direct cross-owner video insert was unexpectedly allowed by RLS.");

const { data: draftPublicImages } = await anonymous.from("listing_images").select("id").eq("listing_id", listing.id);
const { data: draftPublicVideos } = await anonymous.from("listing_videos").select("id").eq("listing_id", listing.id);
assert((draftPublicImages ?? []).length === 0 && (draftPublicVideos ?? []).length === 0, "Draft media was exposed to public visitors.");

const { error: publishError } = await admin.from("listings").update({ status: "published" }).eq("id", listing.id);
if (publishError) throw new Error(`Could not publish QA listing for public read test: ${publishError.message}`);
const { data: publishedPublicImages } = await anonymous.from("listing_images").select("id").eq("listing_id", listing.id);
const { data: publishedPublicVideos } = await anonymous.from("listing_videos").select("id").eq("listing_id", listing.id);
assert((publishedPublicImages ?? []).length === 2 && (publishedPublicVideos ?? []).length === 1, "Published media was not visible to public visitors.");

await writeFile(statePath, JSON.stringify({
  listingId: listing.id,
  slug: listing.slug,
  ownerId: owner.id,
  otherId: other.id,
  cookie: cookieFor(owner.session),
  imageIds: ownerImages.map((image) => image.id),
}, null, 2), { mode: 0o600, flag: "wx" });

console.log(`QA media API/RLS verification passed for /marketplace/${listing.slug}. Browser state is saved for visual checks.`);

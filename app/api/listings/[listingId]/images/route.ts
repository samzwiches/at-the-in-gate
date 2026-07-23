import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { ACCEPTED_LISTING_IMAGE_TYPES, isAcceptedListingImageType, LISTING_IMAGE_BUCKET, MAX_LISTING_IMAGE_BYTES } from "@/lib/listing-images";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ listingId: string }> };

function imageTypeFromBytes(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg" as const;
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png" as const;
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp" as const;
  return null;
}

function extensionForType(type: (typeof ACCEPTED_LISTING_IMAGE_TYPES)[number]) {
  return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
}

function focalValue(value: unknown) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? Math.round(parsed * 100) / 100 : null;
}

function optionalAltText(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  return value.trim().slice(0, 500) || null;
}

async function ownedListing(listingId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, slug")
    .eq("id", listingId)
    .eq("owner_id", userId)
    .maybeSingle();

  return { supabase, listing: error ? null : data };
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  if (!user) return NextResponse.json({ error: "Sign in before adding listing photos." }, { status: 401 });

  const { supabase, listing } = await ownedListing(listingId, user.id);
  if (!listing) return NextResponse.json({ error: "Only the listing owner can add photos." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_LISTING_IMAGE_BYTES) return NextResponse.json({ error: "Each image must be 6 MB or smaller." }, { status: 400 });
  if (!isAcceptedListingImageType(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedType = imageTypeFromBytes(bytes);
  if (!detectedType || detectedType !== file.type) return NextResponse.json({ error: "That file is not a supported image." }, { status: 400 });

  const focalX = formData.has("focalX") ? focalValue(formData.get("focalX")) : 50;
  const focalY = formData.has("focalY") ? focalValue(formData.get("focalY")) : 50;
  if (focalX === null || focalY === null) return NextResponse.json({ error: "Photo focal points must be between 0 and 100." }, { status: 400 });

  const { data: existingImages, error: imageLookupError } = await supabase
    .from("listing_images")
    .select("sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (imageLookupError) return NextResponse.json({ error: "We could not prepare this image." }, { status: 500 });

  const storagePath = `${listingId}/${crypto.randomUUID()}.${extensionForType(detectedType)}`;
  const { error: storageError } = await supabase.storage
    .from(LISTING_IMAGE_BUCKET)
    .upload(storagePath, bytes, { contentType: detectedType, cacheControl: "3600", upsert: false });
  if (storageError) return NextResponse.json({ error: "We could not store this image. Please try again." }, { status: 500 });

  const altText = optionalAltText(formData.get("altText")) ?? null;
  const { data: image, error: insertError } = await supabase
    .from("listing_images")
    .insert({
      listing_id: listingId,
      owner_id: user.id,
      storage_path: storagePath,
      alt_text: altText,
      focal_x: focalX,
      focal_y: focalY,
      sort_order: (existingImages?.[0]?.sort_order ?? -1) + 1,
    })
    .select("id, listing_id, storage_path, alt_text, focal_x, focal_y, sort_order, is_primary, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(LISTING_IMAGE_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "We could not attach this image to the listing." }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listing.slug}`);
  revalidatePath(`/marketplace/${listing.slug}/edit`);
  revalidatePath("/marketplace/my-listings");
  return NextResponse.json({ image }, { status: 201 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  if (!user) return NextResponse.json({ error: "Sign in before managing listing photos." }, { status: 401 });

  const { supabase, listing } = await ownedListing(listingId, user.id);
  if (!listing) return NextResponse.json({ error: "Only the listing owner can manage photos." }, { status: 403 });

  const body = await request.json().catch(() => null) as { imageId?: string; operation?: "primary" | "up" | "down" | "metadata"; altText?: unknown; focalX?: unknown; focalY?: unknown } | null;
  if (!body?.imageId || !body.operation) return NextResponse.json({ error: "Choose a valid photo action." }, { status: 400 });

  const { data: images, error: imageError } = await supabase
    .from("listing_images")
    .select("id, sort_order")
    .eq("listing_id", listingId)
    .eq("owner_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (imageError || !images) return NextResponse.json({ error: "We could not load these photos." }, { status: 500 });

  const index = images.findIndex((image) => image.id === body.imageId);
  if (index < 0) return NextResponse.json({ error: "Only the listing owner can manage this photo." }, { status: 403 });

  if (body.operation === "primary") {
    const { error } = await supabase.from("listing_images").update({ is_primary: true }).eq("id", body.imageId).eq("listing_id", listingId);
    if (error) return NextResponse.json({ error: "We could not set the primary photo." }, { status: 500 });
  } else if (body.operation === "metadata") {
    const altText = optionalAltText(body.altText);
    const focalX = body.focalX === undefined ? undefined : focalValue(body.focalX);
    const focalY = body.focalY === undefined ? undefined : focalValue(body.focalY);
    if (focalX === null || focalY === null) return NextResponse.json({ error: "Photo focal points must be between 0 and 100." }, { status: 400 });
    if (altText === undefined && focalX === undefined && focalY === undefined) return NextResponse.json({ error: "Choose photo details to update." }, { status: 400 });

    const { error } = await supabase
      .from("listing_images")
      .update({ ...(altText === undefined ? {} : { alt_text: altText }), ...(focalX === undefined ? {} : { focal_x: focalX }), ...(focalY === undefined ? {} : { focal_y: focalY }) })
      .eq("id", body.imageId)
      .eq("listing_id", listingId);
    if (error) return NextResponse.json({ error: "We could not update this photo." }, { status: 500 });
  } else {
    const targetIndex = body.operation === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < images.length) {
      const current = images[index];
      const target = images[targetIndex];
      const { error: targetError } = await supabase.from("listing_images").update({ sort_order: current.sort_order }).eq("id", target.id).eq("listing_id", listingId);
      const { error: currentError } = await supabase.from("listing_images").update({ sort_order: target.sort_order }).eq("id", current.id).eq("listing_id", listingId);
      if (targetError || currentError) return NextResponse.json({ error: "We could not reorder these photos." }, { status: 500 });
    }
  }

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listing.slug}`);
  revalidatePath(`/marketplace/${listing.slug}/edit`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  if (!user) return NextResponse.json({ error: "Sign in before removing listing photos." }, { status: 401 });

  const { supabase, listing } = await ownedListing(listingId, user.id);
  if (!listing) return NextResponse.json({ error: "Only the listing owner can remove photos." }, { status: 403 });

  const imageId = new URL(request.url).searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "Choose a photo to remove." }, { status: 400 });
  const { data: image, error: imageError } = await supabase
    .from("listing_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("listing_id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (imageError || !image) return NextResponse.json({ error: "Only the listing owner can remove this photo." }, { status: 403 });

  const { error: storageError } = await supabase.storage.from(LISTING_IMAGE_BUCKET).remove([image.storage_path]);
  if (storageError) return NextResponse.json({ error: "We could not remove the stored image." }, { status: 500 });
  const { error: deleteError } = await supabase.from("listing_images").delete().eq("id", image.id).eq("listing_id", listingId);
  if (deleteError) return NextResponse.json({ error: "We could not remove the image record." }, { status: 500 });

  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listing.slug}`);
  revalidatePath(`/marketplace/${listing.slug}/edit`);
  revalidatePath("/marketplace/my-listings");
  return NextResponse.json({ ok: true });
}

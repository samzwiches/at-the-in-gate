import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { parseListingVideoUrl } from "@/lib/listing-videos";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ listingId: string }> };

function videoTitle(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  return value.trim().slice(0, 200) || null;
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

function revalidateListingMedia(slug: string) {
  revalidatePath("/");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${slug}`);
  revalidatePath(`/marketplace/${slug}/edit`);
  revalidatePath("/marketplace/my-listings");
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  if (!user) return NextResponse.json({ error: "Sign in before adding listing videos." }, { status: 401 });

  const { supabase, listing } = await ownedListing(listingId, user.id);
  if (!listing) return NextResponse.json({ error: "Only the listing owner can add videos." }, { status: 403 });

  const body = await request.json().catch(() => null) as { videoUrl?: unknown; title?: unknown } | null;
  if (!body || typeof body.videoUrl !== "string") return NextResponse.json({ error: "Paste a YouTube or Vimeo URL." }, { status: 400 });
  const parsed = parseListingVideoUrl(body.videoUrl);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const title = videoTitle(body.title);
  if (title === null) return NextResponse.json({ error: "Video titles must be plain text." }, { status: 400 });

  const { data: currentVideos, error: lookupError } = await supabase
    .from("listing_videos")
    .select("sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (lookupError) return NextResponse.json({ error: "We could not prepare this video." }, { status: 500 });

  const { data: video, error } = await supabase
    .from("listing_videos")
    .insert({
      listing_id: listingId,
      owner_id: user.id,
      provider: parsed.provider,
      video_url: parsed.videoUrl,
      provider_video_id: parsed.providerVideoId,
      title: title ?? null,
      sort_order: (currentVideos?.[0]?.sort_order ?? -1) + 1,
    })
    .select("id, listing_id, provider, video_url, provider_video_id, title, sort_order, created_at")
    .single();
  if (error) return NextResponse.json({ error: "We could not add this video." }, { status: 500 });

  revalidateListingMedia(listing.slug);
  return NextResponse.json({ video }, { status: 201 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  if (!user) return NextResponse.json({ error: "Sign in before managing listing videos." }, { status: 401 });

  const { supabase, listing } = await ownedListing(listingId, user.id);
  if (!listing) return NextResponse.json({ error: "Only the listing owner can manage videos." }, { status: 403 });

  const body = await request.json().catch(() => null) as { videoId?: string; operation?: "up" | "down" | "details"; videoUrl?: unknown; title?: unknown } | null;
  if (!body?.videoId || !body.operation) return NextResponse.json({ error: "Choose a valid video action." }, { status: 400 });

  const { data: videos, error: videoError } = await supabase
    .from("listing_videos")
    .select("id, sort_order")
    .eq("listing_id", listingId)
    .eq("owner_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (videoError || !videos) return NextResponse.json({ error: "We could not load these videos." }, { status: 500 });

  const index = videos.findIndex((video) => video.id === body.videoId);
  if (index < 0) return NextResponse.json({ error: "Only the listing owner can manage this video." }, { status: 403 });

  if (body.operation === "details") {
    const title = videoTitle(body.title);
    if (title === null) return NextResponse.json({ error: "Video titles must be plain text." }, { status: 400 });
    const changes: { title?: string | null; provider?: string; video_url?: string; provider_video_id?: string } = {};
    if (title !== undefined) changes.title = title;
    if (body.videoUrl !== undefined) {
      if (typeof body.videoUrl !== "string") return NextResponse.json({ error: "Paste a YouTube or Vimeo URL." }, { status: 400 });
      const parsed = parseListingVideoUrl(body.videoUrl);
      if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
      changes.provider = parsed.provider;
      changes.video_url = parsed.videoUrl;
      changes.provider_video_id = parsed.providerVideoId;
    }
    if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Choose video details to update." }, { status: 400 });

    const { error } = await supabase.from("listing_videos").update(changes).eq("id", body.videoId).eq("listing_id", listingId);
    if (error) return NextResponse.json({ error: "We could not update this video." }, { status: 500 });
  } else {
    const targetIndex = body.operation === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < videos.length) {
      const current = videos[index];
      const target = videos[targetIndex];
      const { error: targetError } = await supabase.from("listing_videos").update({ sort_order: current.sort_order }).eq("id", target.id).eq("listing_id", listingId);
      const { error: currentError } = await supabase.from("listing_videos").update({ sort_order: target.sort_order }).eq("id", current.id).eq("listing_id", listingId);
      if (targetError || currentError) return NextResponse.json({ error: "We could not reorder these videos." }, { status: 500 });
    }
  }

  revalidateListingMedia(listing.slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  if (!user) return NextResponse.json({ error: "Sign in before removing listing videos." }, { status: 401 });

  const { supabase, listing } = await ownedListing(listingId, user.id);
  if (!listing) return NextResponse.json({ error: "Only the listing owner can remove videos." }, { status: 403 });

  const videoId = new URL(request.url).searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "Choose a video to remove." }, { status: 400 });
  const { data: video, error: videoError } = await supabase
    .from("listing_videos")
    .select("id")
    .eq("id", videoId)
    .eq("listing_id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (videoError || !video) return NextResponse.json({ error: "Only the listing owner can remove this video." }, { status: 403 });

  const { error } = await supabase.from("listing_videos").delete().eq("id", video.id).eq("listing_id", listingId);
  if (error) return NextResponse.json({ error: "We could not remove this video." }, { status: 500 });

  revalidateListingMedia(listing.slug);
  return NextResponse.json({ ok: true });
}

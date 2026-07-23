export const LISTING_VIDEO_PROVIDERS = ["youtube", "vimeo"] as const;

export type ListingVideoProvider = (typeof LISTING_VIDEO_PROVIDERS)[number];

export type ParsedListingVideo = {
  provider: ListingVideoProvider;
  videoUrl: string;
  providerVideoId: string;
};

const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;
const vimeoIdPattern = /^\d{1,20}$/;

function youtubeIdFromUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "youtu.be" || hostname === "www.youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(hostname)) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (url.pathname === "/watch") return url.searchParams.get("v");
  if (["embed", "shorts", "live"].includes(segments[0] ?? "")) return segments[1] ?? null;
  return null;
}

function vimeoIdFromUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();
  if (!["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(hostname)) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (hostname === "player.vimeo.com" && segments[0] !== "video") return null;
  return [...segments].reverse().find((segment) => vimeoIdPattern.test(segment)) ?? null;
}

export function parseListingVideoUrl(value: string): ParsedListingVideo | { error: string } {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return { error: "Paste a complete YouTube or Vimeo URL." };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { error: "Use an http or https YouTube or Vimeo URL." };
  }

  const youtubeId = youtubeIdFromUrl(url);
  if (youtubeId) {
    if (!youtubeIdPattern.test(youtubeId)) return { error: "That YouTube link does not include a valid video ID." };
    return { provider: "youtube", videoUrl: url.toString(), providerVideoId: youtubeId };
  }

  const vimeoId = vimeoIdFromUrl(url);
  if (vimeoId) {
    return { provider: "vimeo", videoUrl: url.toString(), providerVideoId: vimeoId };
  }

  return { error: "Use a YouTube or Vimeo video link for this listing." };
}

export function listingVideoEmbedUrl(provider: string, providerVideoId: string | null) {
  if (!providerVideoId) return null;
  if (provider === "youtube" && youtubeIdPattern.test(providerVideoId)) {
    return `https://www.youtube-nocookie.com/embed/${providerVideoId}?rel=0`;
  }
  if (provider === "vimeo" && vimeoIdPattern.test(providerVideoId)) {
    return `https://player.vimeo.com/video/${providerVideoId}?dnt=1`;
  }
  return null;
}

export function listingVideoProviderLabel(provider: string) {
  return provider === "youtube" ? "YouTube" : provider === "vimeo" ? "Vimeo" : "Video";
}

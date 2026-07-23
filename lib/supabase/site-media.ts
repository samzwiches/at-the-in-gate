import "server-only";

import { cache } from "react";
import type { Database } from "@/lib/database.types";
import { SITE_MEDIA_BUCKET } from "@/lib/site-media";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SiteMediaRecord = Database["public"]["Tables"]["site_media"]["Row"];

export type ResolvedSiteMedia = SiteMediaRecord & {
  signedUrl: string;
  mobileSignedUrl: string | null;
};

async function signedUrlForPath(
  client: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof getAdminClient>,
  storagePath: string | null
) {
  if (!storagePath) return null;
  const { data, error } = await client.storage.from(SITE_MEDIA_BUCKET).createSignedUrl(storagePath, 60 * 60);
  return error || !data?.signedUrl ? null : data.signedUrl;
}

async function resolveRecord(
  client: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof getAdminClient>,
  record: SiteMediaRecord
): Promise<ResolvedSiteMedia | null> {
  const signedUrl = await signedUrlForPath(client, record.storage_path);
  if (!signedUrl) return null;

  return {
    ...record,
    signedUrl,
    mobileSignedUrl: await signedUrlForPath(client, record.mobile_storage_path),
  };
}

/** Public page media. RLS only permits current public assignments and their objects. */
export const getSiteMedia = cache(async (mediaKey: string): Promise<ResolvedSiteMedia | null> => {
  const client = await createClient();
  const { data, error } = await client
    .from("site_media")
    .select("id, media_key, page_key, placement, storage_path, alt_text, caption, focal_x, focal_y, overlay_opacity, overlay_tone, overlay_color, mobile_storage_path, created_at, updated_at, updated_by")
    .eq("media_key", mediaKey)
    .maybeSingle();

  if (error || !data) return null;
  return resolveRecord(client, data);
});

/** Admin-only callers should guard access before using this trusted read. */
export async function getSiteMediaForAdmin(): Promise<ResolvedSiteMedia[]> {
  const client = getAdminClient();
  const { data, error } = await client
    .from("site_media")
    .select("id, media_key, page_key, placement, storage_path, alt_text, caption, focal_x, focal_y, overlay_opacity, overlay_tone, overlay_color, mobile_storage_path, created_at, updated_at, updated_by")
    .order("page_key")
    .order("placement");

  if (error || !data) return [];
  const resolved = await Promise.all(data.map((record) => resolveRecord(client, record)));
  return resolved.filter((record): record is ResolvedSiteMedia => Boolean(record));
}

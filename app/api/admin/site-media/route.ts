import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { getMembershipForProfile } from "@/lib/membership/membership";
import {
  ACCEPTED_SITE_MEDIA_TYPES,
  getSiteMediaSlot,
  isAcceptedSiteMediaType,
  MAX_SITE_MEDIA_IMAGE_BYTES,
  normalizeSiteMediaOverlayColor,
  SITE_MEDIA_BUCKET,
  SITE_MEDIA_PAGE_PATHS,
  type SiteMediaOverlayTone,
} from "@/lib/site-media";
import {
  buttonTextContrastResult,
  getSiteSectionAppearanceSection,
  isSiteSectionFontPreset,
  isSiteSectionHeroEdgeStyle,
  isSiteSectionKey,
  normalizeSiteSectionAppearanceColor,
  sectionSupportsAppearanceField,
  SITE_SECTION_APPEARANCE_COLOR_FIELDS,
  type SiteSectionAppearanceValues,
  type SiteSectionKey,
} from "@/lib/site-section-appearance";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  deleteSiteSectionAppearanceForAdmin,
  upsertSiteSectionAppearanceForAdmin,
} from "@/lib/supabase/site-section-appearance";

export const runtime = "nodejs";

const overlayTones = new Set<SiteMediaOverlayTone>(["none", "light", "dark", "cream", "brand"]);

function imageTypeFromBytes(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg" as const;
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png" as const;
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp" as const;
  return null;
}

function extensionForType(type: (typeof ACCEPTED_SITE_MEDIA_TYPES)[number]) {
  return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
}

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function optionalText(formData: FormData, key: string, maxLength: number) {
  const entry = formData.get(key);
  if (typeof entry !== "string") return null;
  const text = entry.trim();
  return text ? text.slice(0, maxLength) : null;
}

function focalValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? Math.round(parsed * 100) / 100 : null;
}

async function requireMediaAdministrator() {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, response: NextResponse.json({ error: "Sign in before managing site media." }, { status: 401 }) };

  const membership = await getMembershipForProfile(user.id).catch(() => null);
  if (!membership?.isAdmin) {
    return { user: null, response: NextResponse.json({ error: "Only administrators can manage site media." }, { status: 403 }) };
  }

  return { user, response: null };
}

async function validateImage(file: File, label: string) {
  if (file.size === 0 || file.size > MAX_SITE_MEDIA_IMAGE_BYTES) {
    return { error: `${label} must be 6 MB or smaller.` };
  }

  if (!isAcceptedSiteMediaType(file.type)) {
    return { error: `${label} must be a JPG, PNG, or WebP image.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedType = imageTypeFromBytes(bytes);
  if (!detectedType || detectedType !== file.type) {
    return { error: `${label} is not a supported image file.` };
  }

  return { bytes, contentType: detectedType };
}

function storagePathFor(pageKey: string, placement: string, contentType: (typeof ACCEPTED_SITE_MEDIA_TYPES)[number]) {
  return `${pageKey}/${placement}/${crypto.randomUUID()}.${extensionForType(contentType)}`;
}

function revalidateMediaSlot(pageKey: string) {
  for (const path of SITE_MEDIA_PAGE_PATHS[pageKey] ?? []) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/site-media");
}

function revalidateSectionAppearance(sectionKey: SiteSectionKey) {
  const section = getSiteSectionAppearanceSection(sectionKey);
  for (const path of section?.paths ?? []) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/site-media");
}

function appearanceColorValue(value: unknown, field: string): { value: string | null } | { error: string } {
  if (value === null || value === undefined || value === "") return { value: null };
  if (typeof value !== "string") return { error: `${field} must be a hexadecimal color.` };

  const normalized = normalizeSiteSectionAppearanceColor(value);
  return normalized
    ? { value: normalized }
    : { error: `${field} must use three or six hexadecimal digits, such as #7b2430 or abc.` };
}

function appearanceFontValue(value: unknown): { value: "inherit" | "serif" | "sans" | null } | { error: string } {
  if (value === null || value === undefined || value === "") return { value: null };
  if (typeof value !== "string" || !isSiteSectionFontPreset(value)) {
    return { error: "Choose inherit, serif, or sans for the font preset." };
  }

  return { value };
}

function appearanceHeroEdgeStyleValue(value: unknown): { value: "inherit" | "soft-fade" | "rounded" | "rounded-fade" | "none" | null } | { error: string } {
  if (value === null || value === undefined || value === "") return { value: null };
  if (typeof value !== "string" || !isSiteSectionHeroEdgeStyle(value)) {
    return { error: "Choose a valid hero edge style." };
  }

  return { value };
}

function appearanceHeroEdgeSizeValue(value: unknown): { value: number | null } | { error: string } {
  if (value === null || value === undefined || value === "") return { value: null };
  const source = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d+$/.test(source)) {
    return { error: "Hero edge size must be a whole number from 0 through 96." };
  }

  const parsed = Number(source);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 96) {
    return { error: "Hero edge size must be a whole number from 0 through 96." };
  }

  return { value: parsed };
}

async function removeIfUnreferenced(storagePath: string) {
  const client = getAdminClient();
  const [primary, mobile] = await Promise.all([
    client.from("site_media").select("id", { count: "exact", head: true }).eq("storage_path", storagePath),
    client.from("site_media").select("id", { count: "exact", head: true }).eq("mobile_storage_path", storagePath),
  ]);

  if ((primary.count ?? 0) + (mobile.count ?? 0) === 0) {
    await client.storage.from(SITE_MEDIA_BUCKET).remove([storagePath]);
  }
}

async function signedUrl(storagePath: string | null) {
  if (!storagePath) return null;
  const { data, error } = await getAdminClient().storage.from(SITE_MEDIA_BUCKET).createSignedUrl(storagePath, 60 * 60);
  return error || !data?.signedUrl ? null : data.signedUrl;
}

export async function POST(request: Request) {
  const authorization = await requireMediaAdministrator();
  if (authorization.response || !authorization.user) return authorization.response!;

  const formData = await request.formData();
  const mediaKey = value(formData, "mediaKey");
  const slot = getSiteMediaSlot(mediaKey);
  if (!slot) return NextResponse.json({ error: "Choose a valid media slot." }, { status: 400 });

  const focalX = focalValue(value(formData, "focalX"));
  const focalY = focalValue(value(formData, "focalY"));
  const overlayOpacity = Number(value(formData, "overlayOpacity"));
  const overlayTone = value(formData, "overlayTone") as SiteMediaOverlayTone;
  const overlayColorInput = value(formData, "overlayColor");
  const overlayColor = normalizeSiteMediaOverlayColor(overlayColorInput);
  if (focalX === null || focalY === null || !Number.isFinite(overlayOpacity) || overlayOpacity < 0 || overlayOpacity > 1 || !overlayTones.has(overlayTone)) {
    return NextResponse.json({ error: "Focal points and overlay settings must stay within the allowed range." }, { status: 400 });
  }
  if (overlayColorInput && !overlayColor) {
    return NextResponse.json({ error: "Custom overlay colors must use three or six hexadecimal digits, such as #7b2430 or abc." }, { status: 400 });
  }

  const client = getAdminClient();
  const { data: existing, error: existingError } = await client
    .from("site_media")
    .select("id, storage_path, mobile_storage_path")
    .eq("media_key", slot.mediaKey)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: "We could not prepare that media slot." }, { status: 500 });

  const primaryFile = formData.get("primaryImage");
  const mobileFile = formData.get("mobileImage");
  const removeMobile = value(formData, "removeMobile") === "true";
  const uploadedPaths: string[] = [];

  let storagePath = existing?.storage_path ?? null;
  let mobileStoragePath = removeMobile ? null : existing?.mobile_storage_path ?? null;

  if (primaryFile instanceof File && primaryFile.size > 0) {
    const validated = await validateImage(primaryFile, "Primary image");
    if ("error" in validated) return NextResponse.json(validated, { status: 400 });
    storagePath = storagePathFor(slot.pageKey, slot.placement, validated.contentType);
    const { error } = await client.storage.from(SITE_MEDIA_BUCKET).upload(storagePath, validated.bytes, {
      contentType: validated.contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) return NextResponse.json({ error: "We could not store the primary image." }, { status: 500 });
    uploadedPaths.push(storagePath);
  }

  if (mobileFile instanceof File && mobileFile.size > 0) {
    const validated = await validateImage(mobileFile, "Mobile image");
    if ("error" in validated) {
      await Promise.all(uploadedPaths.map((path) => client.storage.from(SITE_MEDIA_BUCKET).remove([path])));
      return NextResponse.json(validated, { status: 400 });
    }
    mobileStoragePath = storagePathFor(slot.pageKey, `${slot.placement}-mobile`, validated.contentType);
    const { error } = await client.storage.from(SITE_MEDIA_BUCKET).upload(mobileStoragePath, validated.bytes, {
      contentType: validated.contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      await Promise.all(uploadedPaths.map((path) => client.storage.from(SITE_MEDIA_BUCKET).remove([path])));
      return NextResponse.json({ error: "We could not store the mobile image." }, { status: 500 });
    }
    uploadedPaths.push(mobileStoragePath);
  }

  if (!storagePath) {
    return NextResponse.json({ error: "Upload a primary image before saving this slot." }, { status: 400 });
  }

  const { data: saved, error: saveError } = await client
    .from("site_media")
    .upsert({
      media_key: slot.mediaKey,
      page_key: slot.pageKey,
      placement: slot.placement,
      storage_path: storagePath,
      mobile_storage_path: mobileStoragePath,
      alt_text: optionalText(formData, "altText", 500),
      caption: optionalText(formData, "caption", 500),
      focal_x: focalX,
      focal_y: focalY,
      overlay_opacity: Math.round(overlayOpacity * 100) / 100,
      overlay_tone: overlayTone,
      overlay_color: overlayColor,
      updated_by: authorization.user.id,
    }, { onConflict: "media_key" })
    .select("id, media_key, page_key, placement, storage_path, mobile_storage_path, alt_text, caption, focal_x, focal_y, overlay_opacity, overlay_tone, overlay_color, created_at, updated_at, updated_by")
    .single();

  if (saveError || !saved) {
    await Promise.all(uploadedPaths.map((path) => client.storage.from(SITE_MEDIA_BUCKET).remove([path])));
    return NextResponse.json({ error: "We could not save that media assignment." }, { status: 500 });
  }

  const obsoletePaths = [existing?.storage_path, existing?.mobile_storage_path].filter(
    (path): path is string => Boolean(path && path !== storagePath && path !== mobileStoragePath)
  );
  await Promise.all(obsoletePaths.map((path) => removeIfUnreferenced(path)));
  revalidateMediaSlot(slot.pageKey);

  return NextResponse.json({
    media: {
      ...saved,
      signedUrl: await signedUrl(saved.storage_path),
      mobileSignedUrl: await signedUrl(saved.mobile_storage_path),
    },
    message: "Media saved. The assigned page now uses this version.",
  });
}

export async function PATCH(request: Request) {
  const authorization = await requireMediaAdministrator();
  if (authorization.response || !authorization.user) return authorization.response!;

  const payload: Record<string, unknown> = await request.json().catch(() => ({}));
  const sectionKey = typeof payload.sectionKey === "string" ? payload.sectionKey.trim() : "";
  if (!isSiteSectionKey(sectionKey)) {
    return NextResponse.json({ error: "Choose a valid appearance section." }, { status: 400 });
  }
  const section = getSiteSectionAppearanceSection(sectionKey);
  if (!section) return NextResponse.json({ error: "Choose a valid appearance section." }, { status: 400 });

  const fontPreset = sectionSupportsAppearanceField(sectionKey, "font_preset")
    ? appearanceFontValue(payload.fontPreset)
    : { value: null };
  if ("error" in fontPreset) return NextResponse.json(fontPreset, { status: 400 });

  const values: SiteSectionAppearanceValues = {
    font_preset: fontPreset.value,
    default_text_color: null,
    eyebrow_text_color: null,
    heading_text_color: null,
    body_text_color: null,
    button_text_color: null,
    metadata_text_color: null,
    navigation_text_color: null,
    background_color: null,
    surface_color: null,
    border_color: null,
    hero_edge_style: null,
    hero_edge_size: null,
  };

  for (const field of SITE_SECTION_APPEARANCE_COLOR_FIELDS) {
    if (!sectionSupportsAppearanceField(sectionKey, field)) continue;
    const color = appearanceColorValue(payload[field], field.replaceAll("_", " "));
    if ("error" in color) return NextResponse.json(color, { status: 400 });
    values[field] = color.value;
  }

  if (sectionSupportsAppearanceField(sectionKey, "hero_edge_style")) {
    const heroEdgeStyle = appearanceHeroEdgeStyleValue(payload.hero_edge_style);
    if ("error" in heroEdgeStyle) return NextResponse.json(heroEdgeStyle, { status: 400 });
    values.hero_edge_style = heroEdgeStyle.value;
  }
  if (sectionSupportsAppearanceField(sectionKey, "hero_edge_size")) {
    const heroEdgeSize = appearanceHeroEdgeSizeValue(payload.hero_edge_size);
    if ("error" in heroEdgeSize) return NextResponse.json(heroEdgeSize, { status: 400 });
    values.hero_edge_size = heroEdgeSize.value;
  }

  const buttonContrast = buttonTextContrastResult(values.button_text_color);
  if (!buttonContrast.passes) {
    return NextResponse.json({ error: "Button text must meet WCAG AA contrast against both hunter green and oxblood hover backgrounds." }, { status: 400 });
  }

  const { data, error } = await upsertSiteSectionAppearanceForAdmin({
    section_key: sectionKey,
    font_preset: values.font_preset ?? null,
    default_text_color: values.default_text_color ?? null,
    eyebrow_text_color: values.eyebrow_text_color ?? null,
    heading_text_color: values.heading_text_color ?? null,
    body_text_color: values.body_text_color ?? null,
    button_text_color: values.button_text_color ?? null,
    metadata_text_color: values.metadata_text_color ?? null,
    navigation_text_color: values.navigation_text_color ?? null,
    background_color: values.background_color ?? null,
    surface_color: values.surface_color ?? null,
    border_color: values.border_color ?? null,
    hero_edge_style: values.hero_edge_style ?? null,
    hero_edge_size: values.hero_edge_size ?? null,
    updated_by: authorization.user.id,
  });

  if (error || !data) {
    return NextResponse.json({ error: "We could not save that appearance treatment." }, { status: 500 });
  }

  revalidateSectionAppearance(sectionKey);
  return NextResponse.json({ appearance: data, message: "Appearance saved. Refresh any public page that was already open to see the latest treatment." });
}

export async function DELETE(request: Request) {
  const authorization = await requireMediaAdministrator();
  if (authorization.response || !authorization.user) return authorization.response!;

  const url = new URL(request.url);
  const appearanceKey = url.searchParams.get("appearanceKey")?.trim() ?? "";
  if (appearanceKey) {
    if (!isSiteSectionKey(appearanceKey)) {
      return NextResponse.json({ error: "Choose a valid appearance section." }, { status: 400 });
    }

    const { error } = await deleteSiteSectionAppearanceForAdmin(appearanceKey);
    if (error) return NextResponse.json({ error: "We could not reset that appearance treatment." }, { status: 500 });

    revalidateSectionAppearance(appearanceKey);
    return NextResponse.json({ message: "Appearance reset to the source-controlled page defaults." });
  }

  const mediaKey = url.searchParams.get("mediaKey")?.trim() ?? "";
  const slot = getSiteMediaSlot(mediaKey);
  if (!slot) return NextResponse.json({ error: "Choose a valid media slot." }, { status: 400 });

  const client = getAdminClient();
  const { data: deleted, error } = await client
    .from("site_media")
    .delete()
    .eq("media_key", slot.mediaKey)
    .select("storage_path, mobile_storage_path")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "We could not reset that media slot." }, { status: 500 });
  if (deleted) {
    await Promise.all([deleted.storage_path, deleted.mobile_storage_path].filter((path): path is string => Boolean(path)).map((path) => removeIfUnreferenced(path)));
  }

  revalidateMediaSlot(slot.pageKey);
  return NextResponse.json({ message: "Reset to the original page treatment." });
}

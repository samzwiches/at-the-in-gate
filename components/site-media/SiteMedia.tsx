import Image from "next/image";
import type { CSSProperties } from "react";
import type { SiteMediaFallback } from "@/lib/site-media";
import { getSiteMedia } from "@/lib/supabase/site-media";

type SiteMediaProps = {
  mediaKey: string;
  fallback?: SiteMediaFallback | null;
  alt?: string;
  sizes: string;
  fit?: "cover" | "contain";
  className?: string;
  fallbackFocalPositionClassName?: string;
  loading?: "eager" | "lazy";
};

/**
 * Resolves a current site-media assignment, then deliberately falls back to
 * the local image already used by the page. The mobile source is only emitted
 * when an administrator has supplied a separate crop.
 */
export default async function SiteMedia({
  mediaKey,
  fallback = null,
  alt,
  sizes,
  fit = "cover",
  className = "",
  fallbackFocalPositionClassName,
  loading,
}: SiteMediaProps) {
  const assignedMedia = await getSiteMedia(mediaKey);
  const source = assignedMedia?.signedUrl ?? fallback?.src;

  if (!source) return null;

  const resolvedAlt = alt ?? assignedMedia?.alt_text ?? fallback?.alt ?? "";
  const focalX = assignedMedia?.focal_x ?? fallback?.focalX ?? 50;
  const focalY = assignedMedia?.focal_y ?? fallback?.focalY ?? 50;
  const useFallbackPositionClass = Boolean(!assignedMedia && fallbackFocalPositionClassName);
  const style: CSSProperties = useFallbackPositionClass ? { objectFit: fit } : { objectFit: fit, objectPosition: `${focalX}% ${focalY}%` };

  if (assignedMedia?.mobileSignedUrl) {
    return (
      <picture className="absolute inset-0 block">
        <source media="(max-width: 767px)" srcSet={assignedMedia.mobileSignedUrl} />
        <img src={source} alt={resolvedAlt} className={`h-full w-full ${fallbackFocalPositionClassName ?? ""} ${className}`} style={style} />
      </picture>
    );
  }

  return <Image fill src={source} alt={resolvedAlt} sizes={sizes} loading={loading} className={`${useFallbackPositionClass ? fallbackFocalPositionClassName : ""} ${className}`} style={style} />;
}

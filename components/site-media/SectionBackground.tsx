import type { ReactNode } from "react";
import SiteMedia from "@/components/site-media/SiteMedia";
import { hasSiteMediaOverlay, siteMediaOverlayStyle, type SiteMediaFallback } from "@/lib/site-media";
import { siteSectionAppearanceStyle, siteSectionSurfaceStyle, type SiteSectionKey } from "@/lib/site-section-appearance";
import { getSiteSectionAppearance } from "@/lib/supabase/site-section-appearance";
import { getSiteMedia } from "@/lib/supabase/site-media";

type SectionBackgroundProps = {
  mediaKey: string;
  children: ReactNode;
  fallback?: SiteMediaFallback | null;
  appearanceKey?: SiteSectionKey;
  className?: string;
  contentClassName?: string;
  sizes?: string;
};

/** Controlled background treatment for fixed, existing page sections. */
export default async function SectionBackground({
  mediaKey,
  children,
  fallback = null,
  appearanceKey,
  className = "",
  contentClassName = "",
  sizes = "100vw",
}: SectionBackgroundProps) {
  const [media, appearance] = await Promise.all([
    getSiteMedia(mediaKey),
    appearanceKey ? getSiteSectionAppearance(appearanceKey) : null,
  ]);
  const hasVisual = Boolean(media || fallback);
  const overlayTone = media?.overlay_tone ?? fallback?.overlayTone ?? "none";
  const overlayColor = media?.overlay_color ?? fallback?.overlayColor ?? null;
  const overlayOpacity = media?.overlay_opacity ?? fallback?.overlayOpacity ?? 0;
  const surfaceStyle = siteSectionSurfaceStyle(appearance);

  return (
    <section className={`relative ${hasVisual ? "isolate overflow-hidden" : ""} ${className}`} style={siteSectionAppearanceStyle(appearance)}>
      {hasVisual ? <SiteMedia mediaKey={mediaKey} fallback={fallback} sizes={sizes} className="object-cover" /> : null}
      {hasVisual && hasSiteMediaOverlay(overlayTone, overlayOpacity, overlayColor) ? <span className="absolute inset-0" style={siteMediaOverlayStyle(overlayTone, overlayOpacity, overlayColor)} aria-hidden="true" /> : null}
      <div className={`relative ${contentClassName}`}>{surfaceStyle ? <div style={surfaceStyle}>{children}</div> : children}</div>
    </section>
  );
}

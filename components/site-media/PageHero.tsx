import type { ReactNode } from "react";
import SiteMedia from "@/components/site-media/SiteMedia";
import { hasSiteMediaOverlay, siteMediaOverlayStyle, type SiteMediaFallback } from "@/lib/site-media";
import {
  isSiteSectionKey,
  siteSectionAppearanceStyle,
  siteSectionHeroEdgeAttributes,
  siteSectionSurfaceStyle,
  type SiteSectionKey,
} from "@/lib/site-section-appearance";
import { getSiteSectionAppearance } from "@/lib/supabase/site-section-appearance";
import { getSiteMedia } from "@/lib/supabase/site-media";

type PageHeroProps = {
  mediaKey: string;
  children: ReactNode;
  fallback?: SiteMediaFallback | null;
  appearanceKey?: SiteSectionKey;
  className?: string;
  contentClassName?: string;
  sizes?: string;
};

/** A fixed editorial hero shell, not a freeform content surface. */
export default async function PageHero({
  mediaKey,
  children,
  fallback = null,
  appearanceKey,
  className = "",
  contentClassName = "",
  sizes = "(max-width: 1023px) 100vw, 1200px",
}: PageHeroProps) {
  const resolvedAppearanceKey = appearanceKey ?? (isSiteSectionKey(mediaKey) ? mediaKey : null);
  const [media, appearance] = await Promise.all([
    getSiteMedia(mediaKey),
    resolvedAppearanceKey ? getSiteSectionAppearance(resolvedAppearanceKey) : null,
  ]);
  const hasVisual = Boolean(media || fallback);
  const overlayTone = media?.overlay_tone ?? fallback?.overlayTone ?? "none";
  const overlayColor = media?.overlay_color ?? fallback?.overlayColor ?? null;
  const overlayOpacity = media?.overlay_opacity ?? fallback?.overlayOpacity ?? 0;
  const heroEdgeAttributes = siteSectionHeroEdgeAttributes(appearance);
  const hasHeroEdge = "data-hero-edge-style" in heroEdgeAttributes;
  const hasSoftFade = appearance?.hero_edge_style === "soft-fade" || appearance?.hero_edge_style === "rounded-fade";
  const surfaceStyle = siteSectionSurfaceStyle(appearance);

  return (
    <section
      className={`site-page-hero relative ${hasVisual || hasHeroEdge ? "isolate overflow-hidden" : ""} ${appearance?.border_color ? "border" : ""} ${className}`}
      style={siteSectionAppearanceStyle(appearance)}
      {...heroEdgeAttributes}
    >
      {hasVisual ? <SiteMedia mediaKey={mediaKey} fallback={fallback} sizes={sizes} className="object-cover" /> : null}
      {hasVisual && hasSiteMediaOverlay(overlayTone, overlayOpacity, overlayColor) ? <span className="absolute inset-0" style={siteMediaOverlayStyle(overlayTone, overlayOpacity, overlayColor)} aria-hidden="true" /> : null}
      {hasVisual ? <span className="pointer-events-none absolute inset-y-0 left-0 w-[68%]" style={{ background: "linear-gradient(to right, rgba(244, 239, 229, 0.48) 0%, rgba(244, 239, 229, 0.18) 58%, rgba(244, 239, 229, 0) 100%)" }} aria-hidden="true" /> : null}
      {hasSoftFade ? <span className="site-page-hero-edge-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1]" aria-hidden="true" /> : null}
      <div className={`relative z-10 ${contentClassName}`}>{surfaceStyle ? <div style={surfaceStyle}>{children}</div> : children}</div>
    </section>
  );
}

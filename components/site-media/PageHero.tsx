import type { CSSProperties, ReactNode } from "react";
import SiteMedia from "@/components/site-media/SiteMedia";
import { hasSiteMediaOverlay, siteMediaOverlayStyle, type SiteMediaFallback } from "@/lib/site-media";
import {
  isSiteSectionKey,
  relativeLuminance,
  siteSectionAppearanceStyle,
  siteSectionHeroEdgeAttributes,
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

type HeroStyle = CSSProperties & Record<`--section-${string}`, string | undefined>;

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
  const headingLuminance = appearance?.heading_text_color ? relativeLuminance(appearance.heading_text_color) : null;
  const usesLightHeading = headingLuminance !== null && headingLuminance > 0.55;
  const textAssistGradient = usesLightHeading
    ? "linear-gradient(to right, rgba(25, 21, 18, 0.68) 0%, rgba(25, 21, 18, 0.32) 58%, rgba(25, 21, 18, 0) 100%)"
    : "linear-gradient(to right, rgba(244, 239, 229, 0.48) 0%, rgba(244, 239, 229, 0.18) 58%, rgba(244, 239, 229, 0) 100%)";
  const heroStyle: HeroStyle = {
    ...(siteSectionAppearanceStyle(appearance) ?? {}),
    backgroundColor: undefined,
    borderColor: undefined,
    "--section-primary-button-background": appearance?.surface_color ?? undefined,
    "--section-primary-button-hover-background": appearance?.background_color ?? undefined,
    "--section-secondary-button-accent": appearance?.border_color ?? undefined,
  };

  return (
    <section
      className={`site-page-hero relative ${hasVisual || hasHeroEdge ? "isolate overflow-hidden" : ""} ${className}`}
      style={heroStyle}
      {...heroEdgeAttributes}
    >
      {hasVisual ? <SiteMedia mediaKey={mediaKey} fallback={fallback} sizes={sizes} className="object-cover" /> : null}
      {hasVisual && hasSiteMediaOverlay(overlayTone, overlayOpacity, overlayColor) ? <span className="absolute inset-0" style={siteMediaOverlayStyle(overlayTone, overlayOpacity, overlayColor)} aria-hidden="true" /> : null}
      {hasVisual ? <span className="pointer-events-none absolute inset-y-0 left-0 w-[68%]" style={{ background: textAssistGradient }} aria-hidden="true" /> : null}
      {hasSoftFade ? <span className="site-page-hero-edge-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1]" aria-hidden="true" /> : null}
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </section>
  );
}

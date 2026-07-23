import type { ReactNode } from "react";
import SiteMedia from "@/components/site-media/SiteMedia";
import { hasSiteMediaOverlay, siteMediaOverlayStyle, type SiteMediaFallback } from "@/lib/site-media";
import { getSiteMedia } from "@/lib/supabase/site-media";

type PageHeroProps = {
  mediaKey: string;
  children: ReactNode;
  fallback?: SiteMediaFallback | null;
  className?: string;
  contentClassName?: string;
  sizes?: string;
};

/** A fixed editorial hero shell, not a freeform content surface. */
export default async function PageHero({
  mediaKey,
  children,
  fallback = null,
  className = "",
  contentClassName = "",
  sizes = "(max-width: 1023px) 100vw, 1200px",
}: PageHeroProps) {
  const media = await getSiteMedia(mediaKey);
  const hasVisual = Boolean(media || fallback);
  const overlayTone = media?.overlay_tone ?? fallback?.overlayTone ?? "none";
  const overlayColor = media?.overlay_color ?? fallback?.overlayColor ?? null;
  const overlayOpacity = media?.overlay_opacity ?? fallback?.overlayOpacity ?? 0;

  return (
    <section className={`relative ${hasVisual ? "isolate overflow-hidden" : ""} ${className}`}>
      {hasVisual ? <SiteMedia mediaKey={mediaKey} fallback={fallback} sizes={sizes} className="object-cover" /> : null}
      {hasVisual && hasSiteMediaOverlay(overlayTone, overlayOpacity, overlayColor) ? <span className="absolute inset-0" style={siteMediaOverlayStyle(overlayTone, overlayOpacity, overlayColor)} aria-hidden="true" /> : null}
      {hasVisual ? <span className="pointer-events-none absolute inset-y-0 left-0 w-[68%]" style={{ background: "linear-gradient(to right, rgba(244, 239, 229, 0.48) 0%, rgba(244, 239, 229, 0.18) 58%, rgba(244, 239, 229, 0) 100%)" }} aria-hidden="true" /> : null}
      <div className={`relative ${contentClassName}`}>{children}</div>
    </section>
  );
}

import type { ReactNode } from "react";
import SiteMedia from "@/components/site-media/SiteMedia";
import { siteMediaOverlayStyle, type SiteMediaFallback } from "@/lib/site-media";
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
  const overlayOpacity = media?.overlay_opacity ?? fallback?.overlayOpacity ?? 0;

  return (
    <section className={`relative ${hasVisual ? "isolate overflow-hidden" : ""} ${className}`}>
      {hasVisual ? <SiteMedia mediaKey={mediaKey} fallback={fallback} sizes={sizes} className="object-cover" /> : null}
      {hasVisual && overlayTone !== "none" && overlayOpacity > 0 ? <span className="absolute inset-0" style={siteMediaOverlayStyle(overlayTone, overlayOpacity)} aria-hidden="true" /> : null}
      <div className={`relative ${hasVisual ? "bg-[#f4efe5]/92 backdrop-blur-[1px]" : ""} ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
}

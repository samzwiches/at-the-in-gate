import type { ReactNode } from "react";
import { sitePageAppearanceStyle, type SiteSectionKey } from "@/lib/site-section-appearance";
import { getSiteSectionAppearance } from "@/lib/supabase/site-section-appearance";

type PageCanvasTone = "cream" | "blue-gray" | "warm" | "shop" | "mist";

type PageCanvasProps = {
  appearanceKey: Extract<SiteSectionKey, `${string}.page`>;
  tone: PageCanvasTone;
  className?: string;
  children: ReactNode;
};

/** Fixed page-canvas treatment that only accepts the approved page appearance key. */
export default async function PageCanvas({ appearanceKey, tone, className = "", children }: PageCanvasProps) {
  const appearance = await getSiteSectionAppearance(appearanceKey);

  return (
    <main className={`site-page-canvas site-page-canvas--${tone} ${className}`} style={sitePageAppearanceStyle(appearance)}>
      {children}
    </main>
  );
}

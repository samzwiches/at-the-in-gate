import Link from "next/link";
import SiteMedia from "@/components/site-media/SiteMedia";
import { hasSiteMediaOverlay, siteMediaOverlayStyle } from "@/lib/site-media";
import { siteSectionAppearanceStyle, siteSectionSurfaceStyle } from "@/lib/site-section-appearance";
import { getSiteSectionAppearance } from "@/lib/supabase/site-section-appearance";
import { getSiteMedia } from "@/lib/supabase/site-media";

const footerNavigation = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Community", href: "/community" },
  { label: "Membership", href: "/membership" },
  { label: "Events", href: "/events" },
  { label: "Directory", href: "/directory" },
  { label: "Services", href: "/services" },
  { label: "Shippers", href: "/shippers" },
  { label: "Jobs", href: "/jobs" },
  { label: "Reviews", href: "/reviews" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default async function Footer() {
  const [footerMedia, appearance] = await Promise.all([
    getSiteMedia("footer.background"),
    getSiteSectionAppearance("footer"),
  ]);

  return (
    <footer className={`relative isolate overflow-hidden bg-[#22251f] px-5 py-10 text-[color:var(--section-default-color,#e7e1d5)] sm:px-8 lg:px-12 ${appearance?.border_color ? "border" : ""}`} style={siteSectionAppearanceStyle(appearance)}>
      {footerMedia ? <SiteMedia mediaKey="footer.background" sizes="100vw" className="object-cover" /> : null}
      {footerMedia && hasSiteMediaOverlay(footerMedia.overlay_tone, footerMedia.overlay_opacity, footerMedia.overlay_color) ? <span className="absolute inset-0" style={siteMediaOverlayStyle(footerMedia.overlay_tone, footerMedia.overlay_opacity, footerMedia.overlay_color)} aria-hidden="true" /> : null}
      <div className="relative" style={siteSectionSurfaceStyle(appearance)}>
        <div className="mx-auto grid max-w-[1344px] gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="section-appearance-heading-font text-2xl tracking-[-0.03em] text-[color:var(--section-heading-color,#f9f4eb)]">At The In Gate</p>
            <p className="section-appearance-body-font mt-3 max-w-xs text-sm leading-6 text-[color:var(--section-body-color,#c7c3b8)]">A better place to find your people, your next pony, and the note everyone is talking about.</p>
          </div>
          <nav className="grid grid-cols-2 gap-4" aria-label="Footer navigation">
            {footerNavigation.map((item) => <Link key={item.href} href={item.href} className="section-appearance-body-font text-sm text-[color:var(--section-navigation-color,#ded9cf)] transition-colors hover:text-[#d8bd85]">{item.label}</Link>)}
          </nav>
          <div className="md:text-right">
            <p className="section-appearance-body-font text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[color:var(--section-eyebrow-color,#d8bd85)]">In the loop</p>
            <p className="section-appearance-body-font mt-3 text-sm leading-6 text-[color:var(--section-body-color,#c7c3b8)]">The good stuff from the horse world, without the 47-text group thread.</p>
            <Link href="/community" className="section-appearance-body-font mt-4 inline-flex border-b border-[#d8bd85] pb-1 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] hover:text-[#d8bd85]">Join the conversation</Link>
          </div>
        </div>
        <div className="section-appearance-body-font mx-auto mt-10 flex max-w-[1344px] flex-col gap-2 border-t border-[#f9f4eb]/15 pt-5 text-[0.62rem] uppercase tracking-[0.12em] text-[color:var(--section-metadata-color,#a9aaa1)] sm:flex-row sm:justify-between">
          <p>© 2026 At The In Gate</p>
          <p>Built for the people who know the difference.</p>
        </div>
      </div>
    </footer>
  );
}

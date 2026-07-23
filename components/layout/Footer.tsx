import Link from "next/link";
import SiteMedia from "@/components/site-media/SiteMedia";
import { hasSiteMediaOverlay, siteMediaOverlayStyle } from "@/lib/site-media";
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
  const footerMedia = await getSiteMedia("footer.background");

  return (
    <footer className="relative isolate overflow-hidden bg-[#22251f] px-5 py-10 text-[#e7e1d5] sm:px-8 lg:px-12">
      {footerMedia ? <SiteMedia mediaKey="footer.background" sizes="100vw" className="object-cover" /> : null}
      {footerMedia && hasSiteMediaOverlay(footerMedia.overlay_tone, footerMedia.overlay_opacity, footerMedia.overlay_color) ? <span className="absolute inset-0" style={siteMediaOverlayStyle(footerMedia.overlay_tone, footerMedia.overlay_opacity, footerMedia.overlay_color)} aria-hidden="true" /> : null}
      <div className="relative">
        <div className="mx-auto grid max-w-[1344px] gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="font-serif text-2xl tracking-[-0.03em] text-[#f9f4eb]">At The In Gate</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#c7c3b8]">A better place to find your people, your next pony, and the note everyone is talking about.</p>
          </div>
          <nav className="grid grid-cols-2 gap-4" aria-label="Footer navigation">
            {footerNavigation.map((item) => <Link key={item.href} href={item.href} className="text-sm text-[#ded9cf] transition-colors hover:text-[#d8bd85]">{item.label}</Link>)}
          </nav>
          <div className="md:text-right">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#d8bd85]">In the loop</p>
            <p className="mt-3 text-sm leading-6 text-[#c7c3b8]">The good stuff from the horse world, without the 47-text group thread.</p>
            <Link href="/community" className="mt-4 inline-flex border-b border-[#d8bd85] pb-1 text-sm font-bold text-[#f9f4eb] hover:text-[#d8bd85]">Join the conversation</Link>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-[1344px] flex-col gap-2 border-t border-[#f9f4eb]/15 pt-5 text-[0.62rem] uppercase tracking-[0.12em] text-[#a9aaa1] sm:flex-row sm:justify-between">
          <p>© 2026 At The In Gate</p>
          <p>Built for the people who know the difference.</p>
        </div>
      </div>
    </footer>
  );
}

import {
  normalizeSiteSectionAppearanceColor,
  type SiteSectionKey,
} from "@/lib/site-section-appearance";

export const SITE_MEDIA_BUCKET = "site-media";
export const MAX_SITE_MEDIA_IMAGE_BYTES = 6 * 1024 * 1024;
export const ACCEPTED_SITE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SiteMediaOverlayTone = "none" | "light" | "dark" | "cream" | "brand";
export type SiteMediaPresentation = "full-bleed-hero" | "contained-editorial" | "card-image" | "section-background" | "subtle-texture";

export type SiteMediaFallback = {
  src: string;
  alt: string;
  focalX?: number;
  focalY?: number;
  overlayOpacity?: number;
  overlayTone?: SiteMediaOverlayTone;
  overlayColor?: string;
};

export type SiteMediaSlot = {
  mediaKey: string;
  pageKey: string;
  placement: "hero" | "section-background" | "footer-background";
  group: "Home" | "Marketplace" | "Community" | "Events" | "Directory" | "Reviews" | "Jobs" | "Membership" | "Shop" | "About" | "Contact" | "Services" | "Shippers" | "Footer";
  label: string;
  guidance: string;
  previewAspectRatio: string;
  presentation: SiteMediaPresentation;
  appearanceKey: SiteSectionKey;
  fallback: SiteMediaFallback | null;
};

export const SITE_MEDIA_SLOTS: readonly SiteMediaSlot[] = [
  {
    mediaKey: "home.hero",
    pageKey: "home",
    placement: "hero",
    group: "Home",
    label: "Home feature panel",
    guidance: "The green field-notes panel beside the opening message.",
    previewAspectRatio: "4 / 5",
    presentation: "full-bleed-hero",
    appearanceKey: "home.hero",
    fallback: {
      src: "/images/listings/copperfield-braided-pony.jpg",
      alt: "Champion pony and rider returning from a hunter ring",
      focalX: 50,
      focalY: 42,
      overlayOpacity: 0.55,
      overlayTone: "brand",
    },
  },
  {
    mediaKey: "home.community_background",
    pageKey: "home",
    placement: "section-background",
    group: "Home",
    label: "Community section background",
    guidance: "The pale blue-gray conversation section below the market board.",
    previewAspectRatio: "16 / 9",
    presentation: "section-background",
    appearanceKey: "home.community",
    fallback: null,
  },
  {
    mediaKey: "marketplace.hero",
    pageKey: "marketplace",
    placement: "hero",
    group: "Marketplace",
    label: "Marketplace heading",
    guidance: "The market board introduction above category controls.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "marketplace.hero",
    fallback: null,
  },
  {
    mediaKey: "community.hero",
    pageKey: "community",
    placement: "hero",
    group: "Community",
    label: "Community heading",
    guidance: "The member-space introduction at the top of Community.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "community.hero",
    fallback: null,
  },
  {
    mediaKey: "events.hero",
    pageKey: "events",
    placement: "hero",
    group: "Events",
    label: "Events heading",
    guidance: "The show-circuit introduction above event filters.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "events.hero",
    fallback: null,
  },
  {
    mediaKey: "directory.hero",
    pageKey: "directory",
    placement: "hero",
    group: "Directory",
    label: "Directory heading",
    guidance: "The people-and-programs introduction above category controls.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "directory.hero",
    fallback: null,
  },
  {
    mediaKey: "reviews.hero",
    pageKey: "reviews",
    placement: "hero",
    group: "Reviews",
    label: "Reviews heading",
    guidance: "The references-and-reviews introduction above the published review cards.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "directory.hero",
    fallback: null,
  },
  {
    mediaKey: "jobs.hero",
    pageKey: "jobs",
    placement: "hero",
    group: "Jobs",
    label: "Jobs heading",
    guidance: "The barn-calls introduction above role categories.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "jobs.hero",
    fallback: null,
  },
  {
    mediaKey: "membership.hero",
    pageKey: "membership",
    placement: "hero",
    group: "Membership",
    label: "Membership heading",
    guidance: "The member-pass introduction at the top of Membership.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "membership.hero",
    fallback: null,
  },
  {
    mediaKey: "shop.hero",
    pageKey: "shop",
    placement: "hero",
    group: "Shop",
    label: "Shop heading",
    guidance: "The tack-trunk introduction above the collection categories.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "shop.hero",
    fallback: null,
  },
  {
    mediaKey: "about.hero",
    pageKey: "about",
    placement: "hero",
    group: "About",
    label: "About opening",
    guidance: "The opening editorial statement on the About page.",
    previewAspectRatio: "16 / 7",
    presentation: "contained-editorial",
    appearanceKey: "about.hero",
    fallback: null,
  },
  {
    mediaKey: "contact.hero",
    pageKey: "contact",
    placement: "hero",
    group: "Contact",
    label: "Contact heading",
    guidance: "The opening note above the contact form.",
    previewAspectRatio: "16 / 7",
    presentation: "contained-editorial",
    appearanceKey: "contact.hero",
    fallback: null,
  },
  {
    mediaKey: "services.hero",
    pageKey: "services",
    placement: "hero",
    group: "Services",
    label: "Services heading",
    guidance: "The services introduction above category navigation.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "services.hero",
    fallback: null,
  },
  {
    mediaKey: "shippers.hero",
    pageKey: "shippers",
    placement: "hero",
    group: "Shippers",
    label: "Shippers heading",
    guidance: "The shipping-routes introduction above the route board.",
    previewAspectRatio: "16 / 7",
    presentation: "full-bleed-hero",
    appearanceKey: "shippers.hero",
    fallback: null,
  },
  {
    mediaKey: "footer.background",
    pageKey: "footer",
    placement: "footer-background",
    group: "Footer",
    label: "Footer background",
    guidance: "A low-key image behind the sitewide footer. Keep text contrast in mind.",
    previewAspectRatio: "16 / 5",
    presentation: "subtle-texture",
    appearanceKey: "footer",
    fallback: null,
  },
] as const;

export const SITE_MEDIA_GROUPS = ["Home", "Marketplace", "Community", "Events", "Directory", "Reviews", "Jobs", "Membership", "Shop", "About", "Contact", "Services", "Shippers", "Footer"] as const;

export const SITE_MEDIA_PAGE_PATHS: Record<string, string[]> = {
  home: ["/"],
  marketplace: ["/marketplace"],
  community: ["/community"],
  events: ["/events"],
  directory: ["/directory"],
  reviews: ["/reviews"],
  jobs: ["/jobs"],
  membership: ["/membership"],
  shop: ["/shop"],
  about: ["/about"],
  contact: ["/contact"],
  services: ["/services"],
  shippers: ["/shippers"],
  footer: [],
};

export function getSiteMediaSlot(mediaKey: string) {
  return SITE_MEDIA_SLOTS.find((slot) => slot.mediaKey === mediaKey) ?? null;
}

export function isAcceptedSiteMediaType(value: string): value is (typeof ACCEPTED_SITE_MEDIA_TYPES)[number] {
  return ACCEPTED_SITE_MEDIA_TYPES.includes(value as (typeof ACCEPTED_SITE_MEDIA_TYPES)[number]);
}

/** Returns a stable six-digit hexadecimal color, or null for invalid/empty values. */
export const normalizeSiteMediaOverlayColor = normalizeSiteSectionAppearanceColor;

export function hasSiteMediaOverlay(
  tone: SiteMediaOverlayTone | string,
  opacity: number,
  overlayColor?: string | null
) {
  return opacity > 0 && (Boolean(normalizeSiteSectionAppearanceColor(overlayColor)) || tone !== "none");
}

export function siteMediaOverlayStyle(
  tone: SiteMediaOverlayTone | string,
  opacity: number,
  overlayColor?: string | null
) {
  const colors: Record<SiteMediaOverlayTone, string> = {
    none: "transparent",
    light: "#f9f5ed",
    dark: "#242721",
    cream: "#e7e1d5",
    brand: "#2d4737",
  };

  const safeTone: SiteMediaOverlayTone = tone in colors ? tone as SiteMediaOverlayTone : "none";
  return {
    backgroundColor: normalizeSiteSectionAppearanceColor(overlayColor) ?? colors[safeTone],
    opacity,
  };
}

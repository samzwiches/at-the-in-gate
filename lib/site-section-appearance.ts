import type { CSSProperties } from "react";
import type { Database } from "@/lib/database.types";

export const SITE_SECTION_APPEARANCE_SECTIONS = [
  {
    sectionKey: "header",
    label: "Header appearance",
    group: "Header",
    kind: "header",
    guidance: "The sitewide masthead and both navigation treatments.",
    controls: ["font", "default", "navigation", "background", "border"],
    paths: ["/"],
  },
  {
    sectionKey: "footer",
    label: "Footer appearance",
    group: "Footer",
    kind: "footer",
    guidance: "The sitewide close, including its navigation and invitation.",
    controls: ["font", "default", "heading", "body", "button", "metadata", "navigation", "background", "surface", "border"],
    paths: ["/"],
  },
  {
    sectionKey: "home.hero",
    label: "Home feature panel appearance",
    group: "Home",
    kind: "hero",
    guidance: "The opening message and the field-notes panel beside it.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/"],
  },
  {
    sectionKey: "home.community",
    label: "Home community appearance",
    group: "Home",
    kind: "section",
    guidance: "The community section heading and its invitation to visit the conversation.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border"],
    paths: ["/"],
  },
  {
    sectionKey: "marketplace.hero",
    label: "Marketplace hero appearance",
    group: "Marketplace",
    kind: "hero",
    guidance: "The market-board introduction above the browse controls.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/marketplace"],
  },
  {
    sectionKey: "community.hero",
    label: "Community hero appearance",
    group: "Community",
    kind: "hero",
    guidance: "The member-space introduction at the top of Community.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/community"],
  },
  {
    sectionKey: "events.hero",
    label: "Events hero appearance",
    group: "Events",
    kind: "hero",
    guidance: "The show-circuit introduction above event filters.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/events"],
  },
  {
    sectionKey: "directory.hero",
    label: "Directory hero appearance",
    group: "Directory",
    kind: "hero",
    guidance: "The people-and-programs introduction above category controls.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/directory"],
  },
  {
    sectionKey: "jobs.hero",
    label: "Jobs hero appearance",
    group: "Jobs",
    kind: "hero",
    guidance: "The barn-calls introduction above role categories.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/jobs"],
  },
  {
    sectionKey: "membership.hero",
    label: "Membership hero appearance",
    group: "Membership",
    kind: "hero",
    guidance: "The member-pass introduction at the top of Membership.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/membership"],
  },
  {
    sectionKey: "shop.hero",
    label: "Shop hero appearance",
    group: "Shop",
    kind: "hero",
    guidance: "The tack-trunk introduction above the collection categories.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/shop"],
  },
  {
    sectionKey: "about.hero",
    label: "About hero appearance",
    group: "About",
    kind: "hero",
    guidance: "The opening editorial statement on the About page.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/about"],
  },
  {
    sectionKey: "contact.hero",
    label: "Contact hero appearance",
    group: "Contact",
    kind: "hero",
    guidance: "The opening note above the contact form.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/contact"],
  },
  {
    sectionKey: "services.hero",
    label: "Services hero appearance",
    group: "Services",
    kind: "hero",
    guidance: "The services introduction above category navigation.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/services"],
  },
  {
    sectionKey: "shippers.hero",
    label: "Shippers hero appearance",
    group: "Shippers",
    kind: "hero",
    guidance: "The shipping-routes introduction above the route board.",
    controls: ["font", "default", "eyebrow", "heading", "body", "button", "metadata", "background", "surface", "border", "heroEdgeStyle", "heroEdgeSize"],
    paths: ["/shippers"],
  },
  {
    sectionKey: "home.page",
    label: "Home page canvas",
    group: "Home",
    kind: "page",
    guidance: "The page canvas behind the Home layout. It does not recolor cards or feature panels.",
    controls: ["background"],
    paths: ["/"],
  },
  {
    sectionKey: "marketplace.page",
    label: "Marketplace page canvas",
    group: "Marketplace",
    kind: "page",
    guidance: "The page canvas behind Marketplace. It does not recolor listings, filters, or results.",
    controls: ["background"],
    paths: ["/marketplace"],
  },
  {
    sectionKey: "community.page",
    label: "Community page canvas",
    group: "Community",
    kind: "page",
    guidance: "The page canvas behind Community. It does not recolor discussion cards or the feed.",
    controls: ["background"],
    paths: ["/community"],
  },
  {
    sectionKey: "events.page",
    label: "Events page canvas",
    group: "Events",
    kind: "page",
    guidance: "The page canvas behind Events. It does not recolor event cards, filters, or results.",
    controls: ["background"],
    paths: ["/events"],
  },
  {
    sectionKey: "directory.page",
    label: "Directory page canvas",
    group: "Directory",
    kind: "page",
    guidance: "The page canvas behind Directory. It does not recolor directory entries or category controls.",
    controls: ["background"],
    paths: ["/directory"],
  },
  {
    sectionKey: "jobs.page",
    label: "Jobs page canvas",
    group: "Jobs",
    kind: "page",
    guidance: "The page canvas behind Jobs. It does not recolor job cards or browse controls.",
    controls: ["background"],
    paths: ["/jobs"],
  },
  {
    sectionKey: "membership.page",
    label: "Membership page canvas",
    group: "Membership",
    kind: "page",
    guidance: "The page canvas behind Membership. It does not alter subscription controls or cards.",
    controls: ["background"],
    paths: ["/membership"],
  },
  {
    sectionKey: "shop.page",
    label: "Shop page canvas",
    group: "Shop",
    kind: "page",
    guidance: "The page canvas behind Shop. It does not recolor shop items or category navigation.",
    controls: ["background"],
    paths: ["/shop"],
  },
  {
    sectionKey: "about.page",
    label: "About page canvas",
    group: "About",
    kind: "page",
    guidance: "The page canvas behind About. It does not alter story cards or editorial content.",
    controls: ["background"],
    paths: ["/about"],
  },
  {
    sectionKey: "contact.page",
    label: "Contact page canvas",
    group: "Contact",
    kind: "page",
    guidance: "The page canvas behind Contact. It does not recolor form controls.",
    controls: ["background"],
    paths: ["/contact"],
  },
  {
    sectionKey: "services.page",
    label: "Services page canvas",
    group: "Services",
    kind: "page",
    guidance: "The page canvas behind Services. It does not recolor service cards or browse controls.",
    controls: ["background"],
    paths: ["/services"],
  },
  {
    sectionKey: "shippers.page",
    label: "Shippers page canvas",
    group: "Shippers",
    kind: "page",
    guidance: "The page canvas behind Shippers. It does not recolor route cards or browse controls.",
    controls: ["background"],
    paths: ["/shippers"],
  },
] as const;

export type SiteSectionKey = (typeof SITE_SECTION_APPEARANCE_SECTIONS)[number]["sectionKey"];
export type SiteSectionAppearanceControl = (typeof SITE_SECTION_APPEARANCE_SECTIONS)[number]["controls"][number];
export type SiteSectionAppearanceKind = (typeof SITE_SECTION_APPEARANCE_SECTIONS)[number]["kind"];
export type SiteSectionAppearanceTextControl = Extract<SiteSectionAppearanceControl, "default" | "eyebrow" | "heading" | "body" | "button" | "metadata" | "navigation">;
export type SiteSectionAppearanceSurfaceControl = Extract<SiteSectionAppearanceControl, "background" | "surface" | "border">;
export type SiteSectionFontPreset = "inherit" | "serif" | "sans";
export type SiteSectionHeroEdgeStyle = "inherit" | "soft-fade" | "rounded" | "rounded-fade" | "none";
export type SiteSectionAppearanceRecord = Database["public"]["Tables"]["site_section_appearance"]["Row"];

export const SITE_SECTION_APPEARANCE_GROUPS = ["Header", "Home", "Marketplace", "Community", "Events", "Directory", "Jobs", "Membership", "Shop", "About", "Contact", "Services", "Shippers", "Footer"] as const;

export const SITE_SECTION_APPEARANCE_TEXT_COLOR_FIELDS = [
  "default_text_color",
  "eyebrow_text_color",
  "heading_text_color",
  "body_text_color",
  "button_text_color",
  "metadata_text_color",
  "navigation_text_color",
] as const;

export const SITE_SECTION_APPEARANCE_SURFACE_COLOR_FIELDS = ["background_color", "surface_color", "border_color"] as const;
export const SITE_SECTION_APPEARANCE_COLOR_FIELDS = [
  ...SITE_SECTION_APPEARANCE_TEXT_COLOR_FIELDS,
  ...SITE_SECTION_APPEARANCE_SURFACE_COLOR_FIELDS,
] as const;

export type SiteSectionAppearanceTextColorField = (typeof SITE_SECTION_APPEARANCE_TEXT_COLOR_FIELDS)[number];
export type SiteSectionAppearanceColorField = (typeof SITE_SECTION_APPEARANCE_COLOR_FIELDS)[number];

export const SITE_SECTION_APPEARANCE_BRAND_SWATCHES = [
  { label: "Charcoal", value: "#242721" },
  { label: "Hunter green", value: "#2d4737" },
  { label: "Oxblood", value: "#7b2430" },
  { label: "Cream", value: "#f9f4eb" },
  { label: "Blue-gray", value: "#5a645d" },
  { label: "Brass", value: "#b08d57" },
] as const;

export const SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL = {
  font: "font_preset",
  default: "default_text_color",
  eyebrow: "eyebrow_text_color",
  heading: "heading_text_color",
  body: "body_text_color",
  button: "button_text_color",
  metadata: "metadata_text_color",
  navigation: "navigation_text_color",
  background: "background_color",
  surface: "surface_color",
  border: "border_color",
  heroEdgeStyle: "hero_edge_style",
  heroEdgeSize: "hero_edge_size",
} as const satisfies Record<SiteSectionAppearanceControl, keyof SiteSectionAppearanceRecord>;

export type SiteSectionAppearanceField = (typeof SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL)[SiteSectionAppearanceControl];

export const SITE_SECTION_APPEARANCE_FIELD_LABELS: Record<SiteSectionAppearanceControl, string> = {
  font: "Font preset",
  default: "Default text color",
  eyebrow: "Eyebrow text color",
  heading: "Heading text color",
  body: "Body text color",
  button: "Button text color",
  metadata: "Metadata text color",
  navigation: "Navigation text color",
  background: "Section background color",
  surface: "Surface color",
  border: "Border color",
  heroEdgeStyle: "Hero edge style",
  heroEdgeSize: "Hero edge size",
};

const fullHexColorPattern = /^#?([0-9a-f]{6})$/i;
const shorthandHexColorPattern = /^#?([0-9a-f]{3})$/i;

export function normalizeSiteSectionAppearanceColor(value: string | null | undefined) {
  const color = value?.trim();
  if (!color) return null;

  const fullMatch = color.match(fullHexColorPattern);
  if (fullMatch) return `#${fullMatch[1].toLowerCase()}`;

  const shorthandMatch = color.match(shorthandHexColorPattern);
  if (shorthandMatch) {
    return `#${shorthandMatch[1].toLowerCase().split("").map((character) => `${character}${character}`).join("")}`;
  }

  return null;
}

export function isSiteSectionKey(value: string): value is SiteSectionKey {
  return SITE_SECTION_APPEARANCE_SECTIONS.some((section) => section.sectionKey === value);
}

export function getSiteSectionAppearanceSection(sectionKey: string) {
  return SITE_SECTION_APPEARANCE_SECTIONS.find((section) => section.sectionKey === sectionKey) ?? null;
}

export function sectionSupportsAppearanceControl(sectionKey: string, control: SiteSectionAppearanceControl) {
  const section = getSiteSectionAppearanceSection(sectionKey);
  return Boolean(section?.controls.includes(control as never));
}

export function sectionSupportsAppearanceField(sectionKey: string, field: SiteSectionAppearanceField) {
  return Object.entries(SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL).some(([control, supportedField]) =>
    supportedField === field && sectionSupportsAppearanceControl(sectionKey, control as SiteSectionAppearanceControl)
  );
}

export function isSiteSectionFontPreset(value: string | null | undefined): value is SiteSectionFontPreset {
  return value === "inherit" || value === "serif" || value === "sans";
}

export function isSiteSectionHeroEdgeStyle(value: string | null | undefined): value is SiteSectionHeroEdgeStyle {
  return value === "inherit" || value === "soft-fade" || value === "rounded" || value === "rounded-fade" || value === "none";
}

export type SiteSectionAppearanceValues = Pick<
  SiteSectionAppearanceRecord,
  | "font_preset"
  | "default_text_color"
  | "eyebrow_text_color"
  | "heading_text_color"
  | "body_text_color"
  | "button_text_color"
  | "metadata_text_color"
  | "navigation_text_color"
  | "background_color"
  | "surface_color"
  | "border_color"
  | "hero_edge_style"
  | "hero_edge_size"
>;

type AppearanceStyle = CSSProperties & Record<`--section-${string}` | `--page-${string}`, string | undefined>;

const FONT_FAMILIES: Record<Exclude<SiteSectionFontPreset, "inherit">, string> = {
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
};

export function siteSectionAppearanceStyle(appearance: SiteSectionAppearanceValues | null | undefined): AppearanceStyle | undefined {
  if (!appearance) return undefined;

  const style: AppearanceStyle = {};
  const variables: Array<[SiteSectionAppearanceTextColorField, `--section-${string}`]> = [
    ["default_text_color", "--section-default-color"],
    ["eyebrow_text_color", "--section-eyebrow-color"],
    ["heading_text_color", "--section-heading-color"],
    ["body_text_color", "--section-body-color"],
    ["button_text_color", "--section-button-color"],
    ["metadata_text_color", "--section-metadata-color"],
    ["navigation_text_color", "--section-navigation-color"],
  ];

  for (const [field, variable] of variables) {
    const color = appearance[field];
    if (color) style[variable] = color;
  }

  if (appearance.font_preset === "serif" || appearance.font_preset === "sans") {
    style["--section-font-family"] = FONT_FAMILIES[appearance.font_preset];
  }
  if (appearance.background_color) style.backgroundColor = appearance.background_color;
  if (appearance.border_color) style.borderColor = appearance.border_color;
  if (appearance.hero_edge_size !== null && appearance.hero_edge_size !== undefined) {
    style["--section-hero-edge-size"] = `${appearance.hero_edge_size}px`;
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

export function sitePageAppearanceStyle(appearance: SiteSectionAppearanceValues | null | undefined): AppearanceStyle | undefined {
  if (!appearance?.background_color) return undefined;
  return { "--page-background-color": appearance.background_color };
}

export function siteSectionSurfaceStyle(appearance: SiteSectionAppearanceValues | null | undefined): CSSProperties | undefined {
  return appearance?.surface_color ? { backgroundColor: appearance.surface_color } : undefined;
}

export function siteSectionHeroEdgeAttributes(appearance: SiteSectionAppearanceValues | null | undefined) {
  const style = appearance?.hero_edge_style;
  if (!isSiteSectionHeroEdgeStyle(style) || style === "inherit") return {};
  return { "data-hero-edge-style": style } as const;
}

function hexChannel(value: string) {
  return Number.parseInt(value, 16) / 255;
}

function linearize(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string) {
  const normalized = normalizeSiteSectionAppearanceColor(color);
  if (!normalized) return null;

  const red = linearize(hexChannel(normalized.slice(1, 3)));
  const green = linearize(hexChannel(normalized.slice(3, 5)));
  const blue = linearize(hexChannel(normalized.slice(5, 7)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export const SITE_SECTION_BUTTON_BACKGROUNDS = ["#2d4737", "#7b2430"] as const;
export const MINIMUM_BUTTON_TEXT_CONTRAST = 4.5;

export function buttonTextContrastResult(value: string | null | undefined) {
  const color = normalizeSiteSectionAppearanceColor(value);
  if (!color) return { color: null, ratios: [] as Array<{ background: string; ratio: number }>, passes: true };

  const ratios = SITE_SECTION_BUTTON_BACKGROUNDS.map((background) => ({
    background,
    ratio: contrastRatio(color, background) ?? 0,
  }));

  return {
    color,
    ratios,
    passes: ratios.every(({ ratio }) => ratio >= MINIMUM_BUTTON_TEXT_CONTRAST),
  };
}

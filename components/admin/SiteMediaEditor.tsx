"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_SITE_MEDIA_IMAGE_BYTES,
  normalizeSiteMediaOverlayColor,
  SITE_MEDIA_GROUPS,
  SITE_MEDIA_SLOTS,
  siteMediaOverlayStyle,
  type SiteMediaOverlayTone,
  type SiteMediaSlot,
} from "@/lib/site-media";
import {
  buttonTextContrastResult,
  contrastRatio,
  getSiteSectionAppearanceSection,
  normalizeSiteSectionAppearanceColor,
  sectionSupportsAppearanceControl,
  SITE_SECTION_APPEARANCE_BRAND_SWATCHES,
  SITE_SECTION_APPEARANCE_SECTIONS,
  SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL,
  SITE_SECTION_APPEARANCE_FIELD_LABELS,
  type SiteSectionAppearanceColorField,
  type SiteSectionAppearanceRecord,
  type SiteSectionFontPreset,
  type SiteSectionHeroEdgeStyle,
  type SiteSectionKey,
  type SiteSectionAppearanceSurfaceControl,
  type SiteSectionAppearanceTextControl,
} from "@/lib/site-section-appearance";

type MediaRecord = {
  id: string;
  media_key: string;
  page_key: string;
  placement: string;
  storage_path: string;
  mobile_storage_path: string | null;
  alt_text: string | null;
  caption: string | null;
  focal_x: number;
  focal_y: number;
  overlay_opacity: number;
  overlay_tone: string;
  overlay_color: string | null;
  signedUrl: string;
  mobileSignedUrl: string | null;
};

type EditorProps = {
  media: MediaRecord[];
  appearances: SiteSectionAppearanceRecord[];
};

type EditorStatus = { kind: "idle" | "saving" | "success" | "error"; message: string };
type AppearanceValues = Record<SiteSectionAppearanceColorField, string> & {
  font_preset: SiteSectionFontPreset | "";
  hero_edge_style: SiteSectionHeroEdgeStyle | "";
  hero_edge_size: string;
};

const acceptedExtensions = new Set(["image/jpeg", "image/png", "image/webp"]);
const textControls = new Set<SiteSectionAppearanceTextControl>(["default", "eyebrow", "heading", "body", "button", "metadata", "navigation"]);
const surfaceControls = new Set<SiteSectionAppearanceSurfaceControl>(["background", "surface", "border"]);

function roundedFocal(value: number) {
  return Math.round(value * 100) / 100;
}

function readError(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

function previewUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : null;
}

function valuesFromAppearance(appearance: SiteSectionAppearanceRecord | null): AppearanceValues {
  return {
    font_preset: appearance?.font_preset === "inherit" || appearance?.font_preset === "serif" || appearance?.font_preset === "sans" ? appearance.font_preset : "",
    default_text_color: appearance?.default_text_color ?? "",
    eyebrow_text_color: appearance?.eyebrow_text_color ?? "",
    heading_text_color: appearance?.heading_text_color ?? "",
    body_text_color: appearance?.body_text_color ?? "",
    button_text_color: appearance?.button_text_color ?? "",
    metadata_text_color: appearance?.metadata_text_color ?? "",
    navigation_text_color: appearance?.navigation_text_color ?? "",
    background_color: appearance?.background_color ?? "",
    surface_color: appearance?.surface_color ?? "",
    border_color: appearance?.border_color ?? "",
    hero_edge_style: appearance?.hero_edge_style === "inherit" || appearance?.hero_edge_style === "soft-fade" || appearance?.hero_edge_style === "rounded" || appearance?.hero_edge_style === "rounded-fade" || appearance?.hero_edge_style === "none" ? appearance.hero_edge_style : "",
    hero_edge_size: appearance?.hero_edge_size === null || appearance?.hero_edge_size === undefined ? "" : String(appearance.hero_edge_size),
  };
}

function controlBackground(sectionKey: SiteSectionKey) {
  if (sectionKey === "footer") return "#22251f";
  if (sectionKey === "home.community") return "#dce4e4";
  return "#f4efe5";
}

function ColorControl({
  sectionKey,
  control,
  value,
  onChange,
  imageBacked,
  label,
  contrastBackground,
}: {
  sectionKey: SiteSectionKey;
  control: SiteSectionAppearanceTextControl | SiteSectionAppearanceSurfaceControl;
  value: string;
  onChange: (value: string) => void;
  imageBacked: boolean;
  label?: string;
  contrastBackground?: string;
}) {
  const field = SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL[control] as SiteSectionAppearanceColorField;
  const normalized = normalizeSiteSectionAppearanceColor(value);
  const isInvalid = Boolean(value && !normalized);
  const isTextControl = textControls.has(control as SiteSectionAppearanceTextControl);
  const ratio = normalized && ["heading", "body", "metadata"].includes(control)
    ? contrastRatio(normalized, contrastBackground ?? controlBackground(sectionKey))
    : null;
  const lowContrast = ratio !== null && ratio < 4.5;
  const helpId = `${sectionKey}-${field}-help`;
  const controlLabel = label ?? SITE_SECTION_APPEARANCE_FIELD_LABELS[control];

  return (
    <fieldset className="border border-[#242721]/15 bg-[#fffaf1] p-3">
      <legend className="px-1 text-sm font-semibold text-[#2d4737]">{controlLabel}</legend>
      <div className="mt-2 flex items-center gap-2">
        <input
          aria-label={`Choose ${controlLabel.toLowerCase()}`}
          type="color"
          value={normalized ?? "#242721"}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-12 shrink-0 border border-[#242721]/25 bg-[#fffaf1] p-1"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="text"
          maxLength={7}
          placeholder="#7b2430"
          aria-invalid={isInvalid}
          aria-describedby={helpId}
          className="min-w-0 flex-1 border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 font-mono text-sm text-[#242721] outline-none focus:border-[#2d4737]"
        />
        {value ? <button type="button" onClick={() => onChange("")} className="shrink-0 text-xs font-bold text-[#2d4737] underline decoration-[#b08d57] underline-offset-4 hover:text-[#7b2430]">Clear</button> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Brand color swatches">
        {SITE_SECTION_APPEARANCE_BRAND_SWATCHES.map((swatch) => (
          <button key={swatch.value} type="button" onClick={() => onChange(swatch.value)} className="inline-flex items-center gap-1.5 border border-[#242721]/20 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#383a33] hover:border-[#7b2430]" title={swatch.label}>
            <span className="size-3 border border-[#242721]/20" style={{ backgroundColor: swatch.value }} aria-hidden="true" />{swatch.label}
          </button>
        ))}
      </div>
      <p id={helpId} className={`mt-3 text-xs leading-5 ${isInvalid ? "text-[#7b2430]" : "text-[#686a61]"}`}>
        {isInvalid ? "Use three or six hexadecimal digits, such as #7b2430 or abc." : normalized ? `Saved as ${normalized}.` : "Choose a brand swatch or enter a custom hex color."}
      </p>
      {imageBacked && isTextControl && ["heading", "body", "metadata"].includes(control) ? <p className="mt-2 text-xs leading-5 text-[#686a61]">This section can sit over an image. Check the live preview and its saved media overlay before publishing this text treatment.</p> : null}
      {!imageBacked && isTextControl && lowContrast ? <p className="mt-2 text-xs leading-5 text-[#7b2430]">This color has low contrast against the section&apos;s source-controlled background. Consider a stronger color.</p> : null}
    </fieldset>
  );
}

function AppearancePanel({ sectionKey, initialAppearance }: { sectionKey: SiteSectionKey; initialAppearance: SiteSectionAppearanceRecord | null }) {
  const router = useRouter();
  const section = getSiteSectionAppearanceSection(sectionKey);
  const [record, setRecord] = useState(initialAppearance);
  const [values, setValues] = useState<AppearanceValues>(() => valuesFromAppearance(initialAppearance));
  const [status, setStatus] = useState<EditorStatus>({ kind: "idle", message: "" });

  if (!section) return null;

  const imageBacked = section.kind === "hero" || section.kind === "section" || section.kind === "footer";
  const activeColorControls = section.controls.filter((control): control is SiteSectionAppearanceTextControl | SiteSectionAppearanceSurfaceControl =>
    textControls.has(control as SiteSectionAppearanceTextControl) || surfaceControls.has(control as SiteSectionAppearanceSurfaceControl)
  );
  const activeColorFields = activeColorControls.map((control) => SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL[control] as SiteSectionAppearanceColorField);
  const invalidField = activeColorFields.find((field) => values[field] && !normalizeSiteSectionAppearanceColor(values[field]));
  const buttonResult = buttonTextContrastResult(values.button_text_color);
  const buttonIsRelevant = section.controls.some((control) => control === "button");
  const buttonFailsContrast = buttonIsRelevant && !buttonResult.passes;
  const activeTextControls = activeColorControls.filter((control): control is SiteSectionAppearanceTextControl => textControls.has(control as SiteSectionAppearanceTextControl));
  const activeSurfaceControls = activeColorControls.filter((control): control is SiteSectionAppearanceSurfaceControl => surfaceControls.has(control as SiteSectionAppearanceSurfaceControl));
  const activeBackgroundColor = normalizeSiteSectionAppearanceColor(values.background_color) ?? controlBackground(sectionKey);
  const hasHeroEdgeControls = sectionSupportsAppearanceControl(sectionKey, "heroEdgeStyle") && sectionSupportsAppearanceControl(sectionKey, "heroEdgeSize");

  function updateColor(field: SiteSectionAppearanceColorField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setStatus({ kind: "idle", message: "" });
  }

  async function saveAppearance() {
    if (invalidField) {
      setStatus({ kind: "error", message: "Use valid hexadecimal colors before saving this appearance treatment." });
      return;
    }
    if (buttonFailsContrast) {
      setStatus({ kind: "error", message: "Button text must remain readable on both hunter green and oxblood hover backgrounds." });
      return;
    }

    setStatus({ kind: "saving", message: "Saving this appearance treatment…" });
    try {
      const response = await fetch("/api/admin/site-media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey,
          fontPreset: values.font_preset,
          default_text_color: values.default_text_color,
          eyebrow_text_color: values.eyebrow_text_color,
          heading_text_color: values.heading_text_color,
          body_text_color: values.body_text_color,
          button_text_color: values.button_text_color,
          metadata_text_color: values.metadata_text_color,
          navigation_text_color: values.navigation_text_color,
          background_color: values.background_color,
          surface_color: values.surface_color,
          border_color: values.border_color,
          hero_edge_style: values.hero_edge_style,
          hero_edge_size: values.hero_edge_size,
        }),
      });
      const payload = await response.json().catch(() => null) as { appearance?: SiteSectionAppearanceRecord; error?: string } | null;
      if (!response.ok || !payload?.appearance) {
        setStatus({ kind: "error", message: readError(payload, "We could not save this appearance treatment.") });
        return;
      }

      setRecord(payload.appearance);
      setValues(valuesFromAppearance(payload.appearance));
      router.refresh();
      setStatus({ kind: "success", message: "Appearance saved. This editor has refreshed; refresh any public page that was already open to see the latest treatment." });
    } catch {
      setStatus({ kind: "error", message: "The appearance editor could not reach the server. Please try again." });
    }
  }

  async function resetAppearance() {
    if (!record) {
      setStatus({ kind: "success", message: "This section is already using its source-controlled appearance." });
      return;
    }

    setStatus({ kind: "saving", message: "Restoring the source-controlled appearance…" });
    try {
      const response = await fetch(`/api/admin/site-media?appearanceKey=${encodeURIComponent(sectionKey)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok) {
        setStatus({ kind: "error", message: readError(payload, "We could not reset this appearance treatment.") });
        return;
      }

      setRecord(null);
      setValues(valuesFromAppearance(null));
      router.refresh();
      setStatus({ kind: "success", message: payload?.message ?? "Restored the source-controlled appearance." });
    } catch {
      setStatus({ kind: "error", message: "The appearance editor could not reach the server. Please try again." });
    }
  }

  return (
    <section className="border-t border-[#242721]/15 bg-[#f3eee4] p-5" aria-label={`${section.label} controls`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#7b2430]">Appearance</p>
          <h3 className="mt-2 font-serif text-2xl tracking-[-0.025em] text-[#242721]">{section.label}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#686a61]">{section.guidance} Empty fields keep the current source-controlled treatment.</p>
        </div>
        <span className={`border px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.13em] ${record ? "border-[#2d4737]/35 bg-[#e5eee7] text-[#2d4737]" : "border-[#b08d57]/50 bg-[#f8f0dc] text-[#62543a]"}`}>{record ? "Saved treatment" : "Source default"}</span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {sectionSupportsAppearanceControl(sectionKey, "font") ? <label className="block border border-[#242721]/15 bg-[#fffaf1] p-3 text-sm font-semibold text-[#2d4737]">Font preset<select value={values.font_preset} onChange={(event) => { setValues((current) => ({ ...current, font_preset: event.target.value as SiteSectionFontPreset | "" })); setStatus({ kind: "idle", message: "" }); }} className="mt-2 w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm font-normal text-[#242721] outline-none focus:border-[#2d4737]"><option value="">Current source treatment</option><option value="inherit">Inherit</option><option value="serif">Serif</option><option value="sans">Sans</option></select><span className="mt-2 block text-xs font-normal leading-5 text-[#686a61]">Only the existing project serif and sans treatments are available.</span></label> : null}
        {activeTextControls.map((control) => {
          const field = SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL[control] as SiteSectionAppearanceColorField;
          return <ColorControl key={field} sectionKey={sectionKey} control={control} value={values[field]} onChange={(value) => updateColor(field, value)} imageBacked={imageBacked} contrastBackground={activeBackgroundColor} />;
        })}
      </div>

      {activeSurfaceControls.length > 0 ? <div className="mt-5 border-t border-[#242721]/15 pt-5"><p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#7b2430]">Canvas and edge treatment</p><div className="mt-3 grid gap-4 lg:grid-cols-2">{activeSurfaceControls.map((control) => {
        const field = SITE_SECTION_APPEARANCE_FIELD_BY_CONTROL[control] as SiteSectionAppearanceColorField;
        const label = control === "background" && section.kind === "page" ? "Page background color" : SITE_SECTION_APPEARANCE_FIELD_LABELS[control];
        return <ColorControl key={field} sectionKey={sectionKey} control={control} label={label} value={values[field]} onChange={(value) => updateColor(field, value)} imageBacked={false} />;
      })}</div>{section.kind === "page" ? <p className="mt-3 text-xs leading-5 text-[#686a61]">This applies only to the approved page canvas. Cards, filters, result grids, forms, and individual detail pages keep their source-controlled surfaces.</p> : null}</div> : null}

      {hasHeroEdgeControls ? <div className="mt-5 border-t border-[#242721]/15 pt-5"><p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#7b2430]">Hero edge treatment</p><div className="mt-3 grid gap-4 lg:grid-cols-2"><label className="block border border-[#242721]/15 bg-[#fffaf1] p-3 text-sm font-semibold text-[#2d4737]">Hero edge style<select value={values.hero_edge_style} onChange={(event) => { setValues((current) => ({ ...current, hero_edge_style: event.target.value as SiteSectionHeroEdgeStyle | "" })); setStatus({ kind: "idle", message: "" }); }} className="mt-2 w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm font-normal text-[#242721] outline-none focus:border-[#2d4737]"><option value="">Current source treatment</option><option value="inherit">Use current design</option><option value="soft-fade">Soft fade</option><option value="rounded">Rounded</option><option value="rounded-fade">Rounded with fade</option><option value="none">Hard rectangle</option></select><span className="mt-2 block text-xs font-normal leading-5 text-[#686a61]">Soft fade blends the hero into the page background. It does not alter the image file.</span></label><label className="block border border-[#242721]/15 bg-[#fffaf1] p-3 text-sm font-semibold text-[#2d4737]">Hero edge size<span className="mt-2 flex items-center gap-3"><input type="range" min="0" max="96" step="1" value={values.hero_edge_size || "24"} onChange={(event) => { setValues((current) => ({ ...current, hero_edge_size: event.target.value })); setStatus({ kind: "idle", message: "" }); }} className="w-full accent-[#2d4737]" /><output className="w-16 text-right text-xs font-bold text-[#7b2430]">{values.hero_edge_size ? `${values.hero_edge_size}px` : "Default"}</output></span><input type="number" min="0" max="96" step="1" value={values.hero_edge_size} onChange={(event) => { setValues((current) => ({ ...current, hero_edge_size: event.target.value })); setStatus({ kind: "idle", message: "" }); }} placeholder="Default" className="mt-3 w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm font-normal text-[#242721] outline-none focus:border-[#2d4737]" /><span className="mt-2 block text-xs font-normal leading-5 text-[#686a61]">Use 0–96 pixels. Rounded heroes default to 20px; soft fades default to 24px when no size is saved.</span></label></div></div> : null}

      {buttonIsRelevant && values.button_text_color ? <p className={`mt-4 border px-3 py-2.5 text-sm leading-6 ${buttonFailsContrast ? "border-[#7b2430]/35 bg-[#f1dedd] text-[#7b2430]" : "border-[#2d4737]/30 bg-[#e5eee7] text-[#2d4737]"}`}>{buttonFailsContrast ? "Button text cannot save: it must meet 4.5:1 contrast against both hunter green and oxblood hover backgrounds." : `Button text passes contrast checks: ${buttonResult.ratios.map(({ background, ratio }) => `${background} ${ratio.toFixed(2)}:1`).join(" · ")}.`}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5">
        <button type="button" onClick={() => void saveAppearance()} disabled={status.kind === "saving" || Boolean(invalidField) || buttonFailsContrast} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{status.kind === "saving" ? "Saving…" : "Save appearance"}</button>
        <button type="button" onClick={() => void resetAppearance()} disabled={status.kind === "saving"} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">Reset appearance</button>
      </div>
      {status.kind !== "idle" ? <p role={status.kind === "error" ? "alert" : "status"} className={`mt-4 border px-3 py-2.5 text-sm leading-6 ${status.kind === "error" ? "border-[#7b2430]/35 bg-[#f1dedd] text-[#7b2430]" : status.kind === "success" ? "border-[#2d4737]/30 bg-[#e5eee7] text-[#2d4737]" : "border-[#b08d57]/40 bg-[#f8f0dc] text-[#62543a]"}`}>{status.message}</p> : null}
    </section>
  );
}

function SiteMediaSlotEditor({ slot, initialMedia, initialAppearance }: { slot: SiteMediaSlot; initialMedia: MediaRecord | null; initialAppearance: SiteSectionAppearanceRecord | null }) {
  const router = useRouter();
  const [record, setRecord] = useState(initialMedia);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [altText, setAltText] = useState(initialMedia?.alt_text ?? slot.fallback?.alt ?? "");
  const [caption, setCaption] = useState(initialMedia?.caption ?? "");
  const [focalX, setFocalX] = useState(initialMedia?.focal_x ?? slot.fallback?.focalX ?? 50);
  const [focalY, setFocalY] = useState(initialMedia?.focal_y ?? slot.fallback?.focalY ?? 50);
  const [overlayTone, setOverlayTone] = useState<SiteMediaOverlayTone>((initialMedia?.overlay_tone as SiteMediaOverlayTone | undefined) ?? slot.fallback?.overlayTone ?? "none");
  const [overlayColor, setOverlayColor] = useState(initialMedia?.overlay_color ?? slot.fallback?.overlayColor ?? "");
  const [overlayOpacity, setOverlayOpacity] = useState(initialMedia?.overlay_opacity ?? slot.fallback?.overlayOpacity ?? 0);
  const [removeMobile, setRemoveMobile] = useState(false);
  const [status, setStatus] = useState<EditorStatus>({ kind: "idle", message: "" });
  const primaryInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
  }, [primaryPreview]);

  useEffect(() => () => {
    if (mobilePreview) URL.revokeObjectURL(mobilePreview);
  }, [mobilePreview]);

  const primarySource = primaryPreview ?? record?.signedUrl ?? slot.fallback?.src ?? null;
  const mobileSource = mobilePreview ?? record?.mobileSignedUrl ?? null;
  const hasSavedAssignment = Boolean(record);
  const validOverlayColor = normalizeSiteMediaOverlayColor(overlayColor);
  const hasOverlayPreview = overlayOpacity > 0 && (Boolean(validOverlayColor) || overlayTone !== "none");

  function chooseFile(file: File | null, kind: "primary" | "mobile") {
    if (!file) return;
    if (!acceptedExtensions.has(file.type) || file.size === 0 || file.size > MAX_SITE_MEDIA_IMAGE_BYTES) {
      setStatus({ kind: "error", message: "Choose a JPG, PNG, or WebP image that is 6 MB or smaller." });
      return;
    }

    const url = previewUrl(file);
    if (kind === "primary") {
      setPrimaryFile(file);
      setPrimaryPreview(url);
    } else {
      setMobileFile(file);
      setMobilePreview(url);
      setRemoveMobile(false);
    }
    setStatus({ kind: "idle", message: "" });
  }

  function chooseFocalPoint(event: PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = roundedFocal(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)));
    const y = roundedFocal(Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100)));
    setFocalX(x);
    setFocalY(y);
  }

  function updateOverlayColor(value: string) {
    setOverlayColor(normalizeSiteMediaOverlayColor(value) ?? value);
  }

  async function save() {
    if (!primaryFile && !record) {
      setStatus({ kind: "error", message: "Choose a primary image before saving this slot." });
      return;
    }

    setStatus({ kind: "saving", message: "Saving this media assignment…" });
    const formData = new FormData();
    formData.set("mediaKey", slot.mediaKey);
    formData.set("altText", altText);
    formData.set("caption", caption);
    formData.set("focalX", String(focalX));
    formData.set("focalY", String(focalY));
    formData.set("overlayTone", overlayTone);
    formData.set("overlayColor", overlayColor);
    formData.set("overlayOpacity", String(overlayOpacity));
    formData.set("removeMobile", String(removeMobile));
    if (primaryFile) formData.set("primaryImage", primaryFile);
    if (mobileFile) formData.set("mobileImage", mobileFile);

    try {
      const response = await fetch("/api/admin/site-media", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null) as { media?: MediaRecord; error?: string } | null;
      if (!response.ok || !payload?.media) {
        setStatus({ kind: "error", message: readError(payload, "We could not save this media assignment.") });
        return;
      }

      setRecord(payload.media);
      setPrimaryFile(null);
      setMobileFile(null);
      setPrimaryPreview(null);
      setMobilePreview(null);
      setOverlayColor(payload.media.overlay_color ?? "");
      setRemoveMobile(false);
      if (primaryInput.current) primaryInput.current.value = "";
      if (mobileInput.current) mobileInput.current.value = "";
      router.refresh();
      setStatus({ kind: "success", message: "Media saved. This editor has refreshed; refresh any public page that was already open to see the latest treatment." });
    } catch {
      setStatus({ kind: "error", message: "The media editor could not reach the server. Please try again." });
    }
  }

  async function reset() {
    if (!record) {
      setStatus({ kind: "success", message: "This slot is already using its original page treatment." });
      return;
    }

    setStatus({ kind: "saving", message: "Restoring the original page treatment…" });
    try {
      const response = await fetch(`/api/admin/site-media?mediaKey=${encodeURIComponent(slot.mediaKey)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok) {
        setStatus({ kind: "error", message: readError(payload, "We could not reset this media slot.") });
        return;
      }

      setRecord(null);
      setPrimaryFile(null);
      setMobileFile(null);
      setPrimaryPreview(null);
      setMobilePreview(null);
      setAltText(slot.fallback?.alt ?? "");
      setCaption("");
      setFocalX(slot.fallback?.focalX ?? 50);
      setFocalY(slot.fallback?.focalY ?? 50);
      setOverlayTone(slot.fallback?.overlayTone ?? "none");
      setOverlayColor(slot.fallback?.overlayColor ?? "");
      setOverlayOpacity(slot.fallback?.overlayOpacity ?? 0);
      setRemoveMobile(false);
      if (primaryInput.current) primaryInput.current.value = "";
      if (mobileInput.current) mobileInput.current.value = "";
      router.refresh();
      setStatus({ kind: "success", message: payload?.message ?? "Restored the original page treatment." });
    } catch {
      setStatus({ kind: "error", message: "The media editor could not reach the server. Please try again." });
    }
  }

  return (
    <article className="border border-[#242721]/20 bg-[#f9f5ed]">
      <div className="border-b border-[#242721]/15 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">{slot.placement.replaceAll("-", " ")}</p>
            <h2 className="mt-2 font-serif text-2xl tracking-[-0.025em] text-[#242721]">{slot.label}</h2>
          </div>
          <span className={`border px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.13em] ${hasSavedAssignment ? "border-[#2d4737]/35 bg-[#e5eee7] text-[#2d4737]" : "border-[#b08d57]/50 bg-[#f8f0dc] text-[#62543a]"}`}>{hasSavedAssignment ? "Live assignment" : "Original treatment"}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#686a61]">{slot.guidance}</p>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)]">
        <div>
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#7b2430]">Primary preview</p>
          <button type="button" onPointerDown={chooseFocalPoint} className="relative mt-3 block w-full overflow-hidden border border-[#242721]/25 bg-[#dce4e4] text-left touch-manipulation" style={{ aspectRatio: slot.previewAspectRatio }} aria-label="Choose the focal point by clicking or tapping the image">
            {primarySource ? <img src={primarySource} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${focalX}% ${focalY}%` }} /> : <span className="flex h-full items-center justify-center px-8 text-center font-serif text-2xl text-[#2d4737]/70">This slot keeps its existing color treatment until an image is added.</span>}
            {primarySource && hasOverlayPreview ? <span className="absolute inset-0" style={siteMediaOverlayStyle(overlayTone, overlayOpacity, validOverlayColor)} aria-hidden="true" /> : null}
            {primarySource ? <span className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f9f5ed] bg-[#7b2430]/85 shadow-[0_0_0_2px_rgba(36,39,33,0.35)]" style={{ left: `${focalX}%`, top: `${focalY}%` }} aria-hidden="true" /> : null}
          </button>
          <p className="mt-3 text-xs leading-5 text-[#686a61]">Click or tap the image to place the crop target. Current position: {focalX}% across, {focalY}% down.</p>
          {mobileSource || mobileFile ? <div className="mt-5"><p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#7b2430]">Mobile crop</p><div className="relative mt-3 aspect-[4/5] overflow-hidden border border-[#242721]/20 bg-[#dce4e4]"><img src={mobileSource ?? ""} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${focalX}% ${focalY}%` }} /></div></div> : null}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="space-y-4">
          <label className="block text-sm font-semibold text-[#2d4737]">Primary image<input ref={primaryInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0] ?? null, "primary")} className="mt-2 block w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm text-[#242721] file:mr-3 file:border-0 file:bg-[#2d4737] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#f9f4eb]" /></label>
          <p className="-mt-2 text-xs leading-5 text-[#686a61]">JPG, PNG, or WebP. Up to 6 MB. The original filename is never used.</p>
          <label className="block text-sm font-semibold text-[#2d4737]">Mobile crop <span className="font-normal text-[#686a61]">(optional)</span><input ref={mobileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0] ?? null, "mobile")} className="mt-2 block w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm text-[#242721] file:mr-3 file:border-0 file:bg-[#2d4737] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#f9f4eb]" /></label>
          {record?.mobile_storage_path ? <label className="flex items-start gap-2 text-xs leading-5 text-[#56584f]"><input type="checkbox" checked={removeMobile} onChange={(event) => setRemoveMobile(event.target.checked)} className="mt-1 size-3.5 accent-[#2d4737]" />Remove the current mobile crop when saving.</label> : null}
          <label className="block text-sm font-semibold text-[#2d4737]">Alt text<textarea value={altText} onChange={(event) => setAltText(event.target.value.slice(0, 500))} maxLength={500} rows={3} className="mt-2 w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm font-normal leading-6 text-[#242721] outline-none focus:border-[#2d4737]" /></label>
          <label className="block text-sm font-semibold text-[#2d4737]">Caption <span className="font-normal text-[#686a61]">(optional)</span><input value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 500))} maxLength={500} className="mt-2 w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm font-normal text-[#242721] outline-none focus:border-[#2d4737]" /></label>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="block text-sm font-semibold text-[#2d4737]">Preset overlay tone<select value={overlayTone} onChange={(event) => setOverlayTone(event.target.value as SiteMediaOverlayTone)} className="mt-2 w-full border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 text-sm font-normal text-[#242721] outline-none focus:border-[#2d4737]"><option value="none">None</option><option value="light">Light</option><option value="dark">Dark</option><option value="cream">Cream</option><option value="brand">Hunter green</option></select></label>
            <div className="block text-sm font-semibold text-[#2d4737]"><label htmlFor={`${slot.mediaKey}-overlay-color`}>Custom overlay color <span className="font-normal text-[#686a61]">(optional)</span></label><div className="mt-2 flex gap-2"><input aria-label="Choose a custom overlay color" type="color" value={validOverlayColor ?? "#2d4737"} onChange={(event) => updateOverlayColor(event.target.value)} className="h-11 w-12 shrink-0 border border-[#242721]/25 bg-[#fffaf1] p-1" /><input id={`${slot.mediaKey}-overlay-color`} value={overlayColor} onChange={(event) => updateOverlayColor(event.target.value)} inputMode="text" maxLength={7} placeholder="#7b2430" aria-invalid={Boolean(overlayColor && !validOverlayColor)} aria-describedby={`${slot.mediaKey}-overlay-color-help`} className="min-w-0 flex-1 border border-[#242721]/25 bg-[#fffaf1] px-3 py-2.5 font-mono text-sm font-normal text-[#242721] outline-none focus:border-[#2d4737]" /></div><p id={`${slot.mediaKey}-overlay-color-help`} className={`mt-2 text-xs leading-5 ${overlayColor && !validOverlayColor ? "text-[#7b2430]" : "text-[#686a61]"}`}>{overlayColor && !validOverlayColor ? "Use three or six hexadecimal digits, such as #7b2430 or abc." : "A valid custom color takes precedence over the preset tone. Color and strength are saved separately."}</p>{overlayColor ? <button type="button" onClick={() => setOverlayColor("")} className="mt-2 text-xs font-bold text-[#2d4737] underline decoration-[#b08d57] underline-offset-4 hover:text-[#7b2430]">Use preset tone instead</button> : null}</div>
            <label className="block text-sm font-semibold text-[#2d4737]">Overlay strength<span className="mt-2 flex items-center gap-3"><input type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={(event) => setOverlayOpacity(Number(event.target.value))} className="w-full accent-[#2d4737]" /><output className="w-9 text-right text-xs font-bold text-[#7b2430]">{Math.round(overlayOpacity * 100)}%</output></span><span className="mt-3 flex items-center gap-2 text-xs font-normal leading-5 text-[#686a61]">Live color and strength <span className="size-5 border border-[#242721]/25" style={siteMediaOverlayStyle(overlayTone, overlayOpacity, validOverlayColor)} aria-hidden="true" /></span></label>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5"><button type="submit" disabled={status.kind === "saving"} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{status.kind === "saving" ? "Saving…" : "Save changes"}</button><button type="button" onClick={() => void reset()} disabled={status.kind === "saving"} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">Reset to existing default</button></div>
          {status.kind !== "idle" ? <p role={status.kind === "error" ? "alert" : "status"} className={`border px-3 py-2.5 text-sm leading-6 ${status.kind === "error" ? "border-[#7b2430]/35 bg-[#f1dedd] text-[#7b2430]" : status.kind === "success" ? "border-[#2d4737]/30 bg-[#e5eee7] text-[#2d4737]" : "border-[#b08d57]/40 bg-[#f8f0dc] text-[#62543a]"}`}>{status.message}</p> : null}
        </form>
      </div>

      <AppearancePanel sectionKey={slot.appearanceKey} initialAppearance={initialAppearance} />
    </article>
  );
}

export default function SiteMediaEditor({ media, appearances }: EditorProps) {
  const mediaByKey = useMemo(() => new Map(media.map((record) => [record.media_key, record])), [media]);
  const appearancesByKey = useMemo(() => new Map(appearances.map((record) => [record.section_key, record])), [appearances]);

  return (
    <div className="mt-8 space-y-10">
      <AppearancePanel sectionKey="header" initialAppearance={appearancesByKey.get("header") ?? null} />
      {SITE_MEDIA_GROUPS.map((group) => {
        const slots = SITE_MEDIA_SLOTS.filter((slot) => slot.group === group);
        const pageAppearance = SITE_SECTION_APPEARANCE_SECTIONS.find((section) => section.group === group && section.kind === "page");
        return (
          <section key={group} aria-labelledby={`${group.toLowerCase()}-media-title`}>
            <div className="border-b border-[#242721]/20 pb-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">{group}</p><h2 id={`${group.toLowerCase()}-media-title`} className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">{group === "Footer" ? "The sitewide close." : `${group} media.`}</h2></div>
            <div className="mt-5 grid gap-5">{pageAppearance ? <AppearancePanel sectionKey={pageAppearance.sectionKey} initialAppearance={appearancesByKey.get(pageAppearance.sectionKey) ?? null} /> : null}{slots.map((slot) => <SiteMediaSlotEditor key={slot.mediaKey} slot={slot} initialMedia={mediaByKey.get(slot.mediaKey) ?? null} initialAppearance={appearancesByKey.get(slot.appearanceKey) ?? null} />)}</div>
          </section>
        );
      })}
    </div>
  );
}

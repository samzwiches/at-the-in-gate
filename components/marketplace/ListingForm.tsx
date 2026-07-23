"use client";

import { useActionState, useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { createListing, submitListingForReview, updateListing } from "@/app/marketplace/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState, type FormActionState } from "@/lib/form-state";
import { isAcceptedListingImageType, MAX_LISTING_IMAGE_BYTES, MAX_LISTING_IMAGE_LABEL } from "@/lib/listing-images";
import { listingVideoEmbedUrl, listingVideoProviderLabel } from "@/lib/listing-videos";
import type { ListingVideo } from "@/lib/supabase/listings";
import type { ListingRelationshipSelection, RelationshipPickerOption } from "@/lib/relationships";

type ListingValues = {
  id: string;
  slug: string;
  horse_name: string;
  listing_type: string;
  division: string;
  location: string;
  price_text: string;
  description: string | null;
  age: number | null;
  height_text: string | null;
  breed: string | null;
  sex: string | null;
};

type ExistingImage = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  focal_x: number;
  focal_y: number;
  sort_order: number;
  is_primary: boolean;
  signedUrl: string | null;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  focalX: number;
  focalY: number;
  status: "queued" | "uploading" | "error";
  error?: string;
};

type PendingVideo = {
  id: string;
  videoUrl: string;
  title: string;
  status: "queued" | "uploading" | "error";
  error?: string;
};

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";
const textButtonClassName = "text-xs font-bold underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-55";

function imageValidationError(file: File) {
  if (!isAcceptedListingImageType(file.type)) return "Use a JPG, PNG, or WebP image.";
  if (file.size === 0 || file.size > MAX_LISTING_IMAGE_BYTES) return `Images must be ${MAX_LISTING_IMAGE_LABEL} or smaller.`;
  return null;
}

function focalPoint(event: PointerEvent<HTMLButtonElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value * 100) / 100));
  return {
    x: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
    y: clamp(((event.clientY - bounds.top) / bounds.height) * 100),
  };
}

function BrowserImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} draggable={false} className={className} />;
}

function FocalPointPicker({ src, alt, focalX, focalY, onChange, disabled = false }: { src: string; alt: string; focalX: number; focalY: number; onChange: (point: { x: number; y: number }) => void; disabled?: boolean }) {
  return <button type="button" onPointerDown={(event) => { event.preventDefault(); onChange(focalPoint(event)); }} disabled={disabled} aria-label={`Set focal point for ${alt}`} className="relative block aspect-[1.25] w-full overflow-hidden bg-[#dce3df] disabled:cursor-not-allowed"><BrowserImage src={src} alt={alt} className="h-full w-full object-contain" /><span aria-hidden="true" style={{ left: `${focalX}%`, top: `${focalY}%` }} className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f9f5ed] bg-[#7b2430]/75 shadow-[0_0_0_2px_rgba(45,71,55,0.55)]"><span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#f9f5ed]" /><span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#f9f5ed]" /></span></button>;
}

function VideoPreview({ provider, providerVideoId, title }: { provider: string; providerVideoId: string | null; title: string }) {
  const embedUrl = listingVideoEmbedUrl(provider, providerVideoId);
  return embedUrl ? <div className="aspect-video bg-[#242721]"><iframe src={embedUrl} title={title} className="h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div> : <div className="flex aspect-video items-center justify-center bg-[#dce3df] p-4 text-center text-sm text-[#56584f]">Preview available after the video link is saved.</div>;
}

export default function ListingForm({ listing, images = [], videos = [], directoryEntries = [], events = [], relationships }: { listing?: ListingValues; images?: ExistingImage[]; videos?: ListingVideo[]; directoryEntries?: RelationshipPickerOption[]; events?: RelationshipPickerOption[]; relationships?: ListingRelationshipSelection }) {
  const router = useRouter();
  const handledSubmissionRef = useRef<string | null>(null);
  const queuedImagesRef = useRef<PendingImage[]>([]);
  const queuedVideosRef = useRef<PendingVideo[]>([]);
  const action = listing ? updateListing : createListing;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);
  const [queuedImages, setQueuedImages] = useState<PendingImage[]>([]);
  const [queuedVideos, setQueuedVideos] = useState<PendingVideo[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [workflowState, setWorkflowState] = useState<FormActionState | null>(null);
  const [imageActionId, setImageActionId] = useState<string | null>(null);
  const [videoActionId, setVideoActionId] = useState<string | null>(null);
  const [imageActionError, setImageActionError] = useState("");
  const [videoActionError, setVideoActionError] = useState("");
  const [focalOverrides, setFocalOverrides] = useState<Record<string, { x: number; y: number }>>({});

  const updateQueuedImages = useCallback((next: PendingImage[] | ((current: PendingImage[]) => PendingImage[])) => {
    setQueuedImages((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      queuedImagesRef.current = resolved;
      return resolved;
    });
  }, []);

  const updateQueuedVideos = useCallback((next: PendingVideo[] | ((current: PendingVideo[]) => PendingVideo[])) => {
    setQueuedVideos((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      queuedVideosRef.current = resolved;
      return resolved;
    });
  }, []);

  function addFiles(files: FileList | File[]) {
    const additions = Array.from(files).map((file) => {
      const error = imageValidationError(file);
      return { id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), altText: "", focalX: 50, focalY: 50, status: error ? "error" as const : "queued" as const, error: error ?? undefined };
    });
    updateQueuedImages((current) => [...current, ...additions]);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  const uploadQueuedImages = useCallback(async (listingId: string) => {
    const uploadable = queuedImagesRef.current.filter((image) => image.status === "queued");
    let hasError = false;

    for (const image of uploadable) {
      updateQueuedImages((current) => current.map((entry) => entry.id === image.id ? { ...entry, status: "uploading", error: undefined } : entry));
      const body = new FormData();
      body.append("image", image.file);
      body.append("altText", image.altText);
      body.append("focalX", String(image.focalX));
      body.append("focalY", String(image.focalY));
      const response = await fetch(`/api/listings/${listingId}/images`, { method: "POST", body });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        hasError = true;
        updateQueuedImages((current) => current.map((entry) => entry.id === image.id ? { ...entry, status: "error", error: payload?.error ?? "Upload failed. Please try again." } : entry));
      } else {
        updateQueuedImages((current) => current.filter((entry) => entry.id !== image.id));
        URL.revokeObjectURL(image.previewUrl);
      }
    }
    return !hasError;
  }, [updateQueuedImages]);

  const uploadQueuedVideos = useCallback(async (listingId: string) => {
    const uploadable = queuedVideosRef.current.filter((video) => video.status === "queued");
    let hasError = false;

    for (const video of uploadable) {
      updateQueuedVideos((current) => current.map((entry) => entry.id === video.id ? { ...entry, status: "uploading", error: undefined } : entry));
      const response = await fetch(`/api/listings/${listingId}/videos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoUrl: video.videoUrl, title: video.title }) });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        hasError = true;
        updateQueuedVideos((current) => current.map((entry) => entry.id === video.id ? { ...entry, status: "error", error: payload?.error ?? "Video could not be added. Please try again." } : entry));
      } else {
        updateQueuedVideos((current) => current.filter((entry) => entry.id !== video.id));
      }
    }
    return !hasError;
  }, [updateQueuedVideos]);

  useEffect(() => {
    if (state.status !== "success" || !state.listingId || !state.submissionId || handledSubmissionRef.current === state.submissionId) return;
    handledSubmissionRef.current = state.submissionId;

    const continueWorkflow = async () => {
      const photosSucceeded = await uploadQueuedImages(state.listingId!);
      const videosSucceeded = await uploadQueuedVideos(state.listingId!);
      let reviewState: FormActionState | null = null;
      if (state.reviewRequested) {
        reviewState = photosSucceeded && videosSucceeded
          ? await submitListingForReview(state.listingId!)
          : { status: "error", message: "Fix failed media uploads before sending this listing for review." };
        setWorkflowState(reviewState);
      }

      if (!listing && state.slug) {
        router.replace(`/marketplace/${state.slug}/edit${reviewState?.status === "error" ? "?photoRequired=1" : ""}`);
        return;
      }

      router.refresh();
    };

    void continueWorkflow();
  }, [listing, router, state.listingId, state.reviewRequested, state.slug, state.status, state.submissionId, uploadQueuedImages, uploadQueuedVideos]);

  async function manageExistingImage(imageId: string, operation: "primary" | "up" | "down" | "remove" | "metadata", details?: { altText?: string; focalX?: number; focalY?: number }) {
    if (!listing) return;
    setImageActionId(imageId);
    setImageActionError("");
    const response = operation === "remove"
      ? await fetch(`/api/listings/${listing.id}/images?imageId=${encodeURIComponent(imageId)}`, { method: "DELETE" })
      : await fetch(`/api/listings/${listing.id}/images`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageId, operation, ...details }) });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) setImageActionError(payload?.error ?? "We could not update this photo.");
    else router.refresh();
    setImageActionId(null);
  }

  async function manageExistingVideo(videoId: string, operation: "up" | "down" | "remove" | "details", details?: { videoUrl?: string; title?: string }) {
    if (!listing) return;
    setVideoActionId(videoId);
    setVideoActionError("");
    const response = operation === "remove"
      ? await fetch(`/api/listings/${listing.id}/videos?videoId=${encodeURIComponent(videoId)}`, { method: "DELETE" })
      : await fetch(`/api/listings/${listing.id}/videos`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoId, operation, ...details }) });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) setVideoActionError(payload?.error ?? "We could not update this video.");
    else router.refresh();
    setVideoActionId(null);
  }

  async function addVideo() {
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) {
      setVideoActionError("Paste a YouTube or Vimeo URL first.");
      return;
    }

    if (!listing) {
      updateQueuedVideos((current) => [...current, { id: crypto.randomUUID(), videoUrl: trimmedUrl, title: videoTitle.trim().slice(0, 200), status: "queued" }]);
      setVideoUrl("");
      setVideoTitle("");
      setVideoActionError("");
      return;
    }

    setVideoActionId("new");
    setVideoActionError("");
    const response = await fetch(`/api/listings/${listing.id}/videos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoUrl: trimmedUrl, title: videoTitle.trim().slice(0, 200) }) });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) setVideoActionError(payload?.error ?? "We could not add this video.");
    else {
      setVideoUrl("");
      setVideoTitle("");
      router.refresh();
    }
    setVideoActionId(null);
  }

  const buttonPrefix = listing ? "Update" : "Save";
  const feedbackState = workflowState ?? state;

  return (
    <form action={formAction} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      {listing ? <input type="hidden" name="listingId" value={listing.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>Horse or pony name<input name="horseName" required maxLength={180} defaultValue={listing?.horse_name} className={inputClassName} /></label>
        <label className={labelClassName}>Listing type<select name="listingType" required defaultValue={listing?.listing_type ?? ""} className={inputClassName}><option value="" disabled>Choose one</option><option value="for_sale">For sale</option><option value="lease">Lease</option><option value="sale_or_lease">Sale or lease</option></select></label>
        <label className={labelClassName}>Division<input name="division" required maxLength={120} defaultValue={listing?.division} placeholder="Children's hunter, equitation, jumper" className={inputClassName} /></label>
        <label className={labelClassName}>Location<input name="location" required maxLength={150} defaultValue={listing?.location} placeholder="City, state" className={inputClassName} /></label>
        <label className={labelClassName}>Price or terms<input name="priceText" required maxLength={120} defaultValue={listing?.price_text} placeholder="$45,000 or lease terms" className={inputClassName} /></label>
        <label className={labelClassName}>Age <span className="font-normal text-[#686a61]">(optional)</span><input name="age" type="number" min="0" max="40" defaultValue={listing?.age ?? ""} className={inputClassName} /></label>
        <label className={labelClassName}>Height <span className="font-normal text-[#686a61]">(optional)</span><input name="heightText" maxLength={60} defaultValue={listing?.height_text ?? ""} placeholder="13.2 hh" className={inputClassName} /></label>
        <label className={labelClassName}>Breed <span className="font-normal text-[#686a61]">(optional)</span><input name="breed" maxLength={120} defaultValue={listing?.breed ?? ""} className={inputClassName} /></label>
        <label className={labelClassName}>Sex <span className="font-normal text-[#686a61]">(optional)</span><input name="sex" maxLength={60} defaultValue={listing?.sex ?? ""} placeholder="Mare, gelding, stallion" className={inputClassName} /></label>
      </div>

      <label className={`mt-5 block ${labelClassName}`}>The useful details<textarea name="description" required minLength={1} maxLength={10000} rows={8} defaultValue={listing?.description ?? ""} className={inputClassName} /></label>

      <section className="mt-8 border-t border-[#242721]/20 pt-6" aria-labelledby="listing-relationships-title">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Connected records</p>
        <h2 id="listing-relationships-title" className="mt-2 font-serif text-3xl tracking-[-0.025em] text-[#242721]">Put the useful people in the picture.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#56584f]">These links are optional. Your listing copy stays exactly as written when there is no matching public directory record or event.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Seller or business<select name="sellerDirectoryEntryId" defaultValue={relationships?.sellerDirectoryEntryId ?? ""} className={inputClassName}><option value="">No linked directory listing</option>{directoryEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.category ? ` · ${entry.category}` : ""}</option>)}</select></label>
          <label className={labelClassName}>Trainer<select name="trainerDirectoryEntryId" defaultValue={relationships?.trainerDirectoryEntryId ?? ""} className={inputClassName}><option value="">No linked trainer</option>{directoryEntries.filter((entry) => entry.category === "trainers").map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <label className={labelClassName}>Barn<select name="barnDirectoryEntryId" defaultValue={relationships?.barnDirectoryEntryId ?? ""} className={inputClassName}><option value="">No linked barn</option>{directoryEntries.filter((entry) => entry.category === "barns").map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <label className={labelClassName}>Shipper<select name="shipperDirectoryEntryId" defaultValue={relationships?.shipperDirectoryEntryId ?? ""} className={inputClassName}><option value="">No linked shipper</option>{directoryEntries.filter((entry) => entry.category === "shippers").map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <label className={labelClassName}>Service provider<select name="serviceProviderDirectoryEntryId" defaultValue={relationships?.serviceProviderDirectoryEntryId ?? ""} className={inputClassName}><option value="">No linked provider</option>{directoryEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.category ? ` · ${entry.category}` : ""}</option>)}</select></label>
          <label className={labelClassName}>Related show or event<select name="eventId" defaultValue={relationships?.eventId ?? ""} className={inputClassName}><option value="">No linked event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
        </div>
      </section>

      <section className="mt-8 border-t border-[#242721]/20 pt-6" aria-labelledby="listing-media-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Photos and video</p><h2 id="listing-media-title" className="mt-2 font-serif text-3xl tracking-[-0.025em] text-[#242721]">Let the horse do some talking.</h2></div><p className="text-xs leading-5 text-[#686a61]">Photos: JPG, PNG, WebP · up to {MAX_LISTING_IMAGE_LABEL}</p></div>

        <div className="mt-6 border-t border-[#242721]/15 pt-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="font-serif text-2xl text-[#242721]">Photos</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-[#56584f]">Tap the most important point in each image to guide card and hero crops. The gallery always keeps the full photograph.</p></div><p className="text-xs leading-5 text-[#686a61]">At least one photo is required for review.</p></div>
          <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="mt-5 border border-dashed border-[#2d4737]/45 bg-[#f9f5ed] p-5 text-center"><label className="inline-flex cursor-pointer border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]"><input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple onChange={onFileChange} className="sr-only" />Choose photos</label><p className="mt-3 text-xs leading-5 text-[#686a61]">Or drop them here. Filenames are never used as storage paths.</p></div>

          {(images.length > 0 || queuedImages.length > 0) ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => {
            const focal = focalOverrides[image.id] ?? { x: image.focal_x, y: image.focal_y };
            return <article key={image.id} className="border border-[#242721]/20 bg-[#f9f5ed]"><div className="relative">{image.signedUrl ? <FocalPointPicker src={image.signedUrl} alt={image.alt_text ?? "Listing photo"} focalX={focal.x} focalY={focal.y} disabled={imageActionId === image.id} onChange={(point) => { setFocalOverrides((current) => ({ ...current, [image.id]: point })); void manageExistingImage(image.id, "metadata", { focalX: point.x, focalY: point.y }); }} /> : <div className="flex aspect-[1.25] items-center justify-center bg-[#dce3df] font-serif text-4xl text-[#2d4737]/60">ATIG</div>}{image.is_primary ? <span className="absolute left-3 top-3 border border-[#f9f5ed]/70 bg-[#2d4737]/75 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#f9f5ed]">Primary</span> : null}</div><div className="space-y-3 p-4"><p className="text-xs leading-5 text-[#686a61]">Tap the image to move the crop target.</p><label className="block text-xs font-semibold text-[#2d4737]">Alt text<input defaultValue={image.alt_text ?? ""} onBlur={(event) => void manageExistingImage(image.id, "metadata", { altText: event.currentTarget.value })} maxLength={500} className="mt-1 w-full border border-[#242721]/20 bg-[#fffaf1] px-2.5 py-2 text-sm text-[#242721] outline-none focus:border-[#2d4737]" /></label><div className="flex flex-wrap gap-x-3 gap-y-2"><button type="button" onClick={() => void manageExistingImage(image.id, "primary")} disabled={imageActionId === image.id || image.is_primary} className={`${textButtonClassName} text-[#2d4737]`}>Make primary</button><button type="button" onClick={() => void manageExistingImage(image.id, "up")} disabled={imageActionId === image.id || index === 0} className={`${textButtonClassName} text-[#2d4737]`}>Move left</button><button type="button" onClick={() => void manageExistingImage(image.id, "down")} disabled={imageActionId === image.id || index === images.length - 1} className={`${textButtonClassName} text-[#2d4737]`}>Move right</button><button type="button" onClick={() => void manageExistingImage(image.id, "remove")} disabled={imageActionId === image.id} className={`${textButtonClassName} text-[#7b2430]`}>Remove</button></div></div></article>;
          })}{queuedImages.map((image) => <article key={image.id} className="border border-[#242721]/20 bg-[#f9f5ed]"><div className="relative"><FocalPointPicker src={image.previewUrl} alt={image.altText || "Selected listing photo"} focalX={image.focalX} focalY={image.focalY} disabled={image.status === "uploading"} onChange={(point) => updateQueuedImages((current) => current.map((entry) => entry.id === image.id ? { ...entry, focalX: point.x, focalY: point.y } : entry))} /></div><div className="space-y-3 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b2430]">{image.status === "uploading" ? "Uploading" : image.status === "error" ? "Needs attention" : "Ready to upload"}</p><p className="text-xs leading-5 text-[#686a61]">Tap the image to place its crop target.</p><label className="block text-xs font-semibold text-[#2d4737]">Alt text<input value={image.altText} onChange={(event) => updateQueuedImages((current) => current.map((entry) => entry.id === image.id ? { ...entry, altText: event.target.value.slice(0, 500) } : entry))} maxLength={500} className="mt-1 w-full border border-[#242721]/20 bg-[#fffaf1] px-2.5 py-2 text-sm text-[#242721] outline-none focus:border-[#2d4737]" /></label>{image.error ? <p className="text-xs leading-5 text-[#7b2430]">{image.error}</p> : null}<button type="button" onClick={() => { URL.revokeObjectURL(image.previewUrl); updateQueuedImages((current) => current.filter((entry) => entry.id !== image.id)); }} disabled={image.status === "uploading"} className={`${textButtonClassName} text-[#7b2430]`}>Remove</button></div></article>)}</div> : null}
          {imageActionError ? <p className="mt-4 text-sm font-semibold text-[#7b2430]" role="alert">{imageActionError}</p> : null}
        </div>

        <div className="mt-8 border-t border-[#242721]/15 pt-6"><div><h3 className="font-serif text-2xl text-[#242721]">Video</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-[#56584f]">Bring a YouTube or Vimeo link for a round that says more than a paragraph. Video is optional, and it never autoplays.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-[1fr_0.75fr_auto] sm:items-end"><label className="block text-sm font-semibold text-[#2d4737]">YouTube or Vimeo URL<input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://…" className={inputClassName} /></label><label className="block text-sm font-semibold text-[#2d4737]">Video title <span className="font-normal text-[#686a61]">(optional)</span><input value={videoTitle} onChange={(event) => setVideoTitle(event.target.value.slice(0, 200))} maxLength={200} placeholder="Pony Finals warm-up" className={inputClassName} /></label><button type="button" onClick={() => void addVideo()} disabled={videoActionId === "new"} className="border border-[#2d4737] px-4 py-3 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-60">{listing ? "Add video" : "Queue video"}</button></div>
          {(videos.length > 0 || queuedVideos.length > 0) ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{videos.map((video, index) => { const label = video.title || `${listingVideoProviderLabel(video.provider)} video`; return <article key={video.id} className="border border-[#242721]/20 bg-[#f9f5ed]"><VideoPreview provider={video.provider} providerVideoId={video.provider_video_id} title={label} /><div className="space-y-3 p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{listingVideoProviderLabel(video.provider)}</p><label className="block text-xs font-semibold text-[#2d4737]">Video title<input defaultValue={video.title ?? ""} onBlur={(event) => void manageExistingVideo(video.id, "details", { title: event.currentTarget.value })} maxLength={200} className="mt-1 w-full border border-[#242721]/20 bg-[#fffaf1] px-2.5 py-2 text-sm text-[#242721] outline-none focus:border-[#2d4737]" /></label><label className="block text-xs font-semibold text-[#2d4737]">Video URL<input defaultValue={video.video_url} onBlur={(event) => void manageExistingVideo(video.id, "details", { videoUrl: event.currentTarget.value })} className="mt-1 w-full border border-[#242721]/20 bg-[#fffaf1] px-2.5 py-2 text-sm text-[#242721] outline-none focus:border-[#2d4737]" /></label><a href={video.video_url} target="_blank" rel="noreferrer" className="inline-flex border-b border-[#2d4737] pb-0.5 text-xs font-bold text-[#2d4737]">Open source video <span className="ml-2" aria-hidden="true">↗</span></a><div className="flex flex-wrap gap-x-3 gap-y-2"><button type="button" onClick={() => void manageExistingVideo(video.id, "up")} disabled={videoActionId === video.id || index === 0} className={`${textButtonClassName} text-[#2d4737]`}>Move up</button><button type="button" onClick={() => void manageExistingVideo(video.id, "down")} disabled={videoActionId === video.id || index === videos.length - 1} className={`${textButtonClassName} text-[#2d4737]`}>Move down</button><button type="button" onClick={() => void manageExistingVideo(video.id, "remove")} disabled={videoActionId === video.id} className={`${textButtonClassName} text-[#7b2430]`}>Remove</button></div></div></article>; })}{queuedVideos.map((video) => <article key={video.id} className="border border-[#242721]/20 bg-[#f9f5ed] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{video.status === "uploading" ? "Adding video" : video.status === "error" ? "Needs attention" : "Queued video"}</p><p className="mt-2 break-words font-serif text-xl text-[#242721]">{video.title || video.videoUrl}</p><p className="mt-2 break-all text-xs leading-5 text-[#686a61]">{video.videoUrl}</p>{video.error ? <p className="mt-3 text-xs leading-5 text-[#7b2430]">{video.error}</p> : null}<button type="button" onClick={() => updateQueuedVideos((current) => current.filter((entry) => entry.id !== video.id))} disabled={video.status === "uploading"} className={`mt-3 ${textButtonClassName} text-[#7b2430]`}>Remove</button></article>)}</div> : null}
          {videoActionError ? <p className="mt-4 text-sm font-semibold text-[#7b2430]" role="alert">{videoActionError}</p> : null}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5"><button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{buttonPrefix} draft</button><button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : listing ? "Send changes for review" : "Send for review"}</button></div>
      <FormFeedback state={feedbackState} />
    </form>
  );
}

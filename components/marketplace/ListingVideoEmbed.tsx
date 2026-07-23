import { listingVideoEmbedUrl, listingVideoProviderLabel } from "@/lib/listing-videos";
import type { ListingVideo } from "@/lib/supabase/listings";

export default function ListingVideoEmbed({ video, className = "" }: { video: ListingVideo; className?: string }) {
  const embedUrl = listingVideoEmbedUrl(video.provider, video.provider_video_id);
  const label = video.title || `${listingVideoProviderLabel(video.provider)} video`;

  return (
    <article className={`border border-[#242721]/20 bg-[#f9f5ed] ${className}`}>
      {embedUrl ? <div className="aspect-video bg-[#242721]"><iframe src={embedUrl} title={label} className="h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div> : <div className="flex aspect-video items-center justify-center bg-[#dce3df] px-5 text-center text-sm leading-6 text-[#56584f]">This video preview is unavailable here.</div>}
      <div className="p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{listingVideoProviderLabel(video.provider)}</p><h3 className="mt-2 font-serif text-xl text-[#242721]">{label}</h3><a href={video.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex border-b border-[#2d4737] pb-0.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Watch on {listingVideoProviderLabel(video.provider)} <span className="ml-2" aria-hidden="true">↗</span></a></div>
    </article>
  );
}

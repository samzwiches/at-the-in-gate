import Link from "next/link";
import LocalImage, { localImageExists } from "@/components/ui/LocalImage";
import { getTaxonomyItem, directoryCategories } from "@/lib/taxonomy";
import type { DirectoryEntryCard as DirectoryEntryCardType } from "@/lib/supabase/directory";
import { directoryLocation } from "@/lib/supabase/directory";

export default function DirectoryEntryCard({ entry }: { entry: DirectoryEntryCardType }) {
  const category = getTaxonomyItem(directoryCategories, entry.category);
  const hasImage = localImageExists(entry.image_path ?? undefined);

  return (
    <article className="border border-[#242721]/20 bg-[#f9f5ed]">
      {hasImage ? (
        <div className="relative aspect-[3/2] overflow-hidden bg-[#dce4e4]">
          <LocalImage src={entry.image_path ?? undefined} alt="" sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw" />
          <span className="absolute inset-0 bg-[#2d4737]/10" aria-hidden="true" />
        </div>
      ) : null}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{category?.label ?? entry.category}</p>
          <span className="text-lg text-[#2d4737]" aria-hidden="true">↗</span>
        </div>
        <h2 className="mt-7 font-serif text-3xl tracking-[-0.03em] text-[#242721]">
          <Link href={`/directory/${entry.slug}`} className="transition-colors hover:text-[#7b2430]">{entry.name}</Link>
        </h2>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#56584f]">{entry.description}</p>
        <p className="mt-6 border-t border-[#242721]/15 pt-4 text-xs text-[#686a61]">{directoryLocation(entry)}</p>
        <Link href={`/directory/${entry.slug}`} className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View listing</Link>
      </div>
    </article>
  );
}

import Link from "next/link";
import LocalImage, { localImageExists } from "@/components/ui/LocalImage";
import { getTaxonomyItem, shopCategories } from "@/lib/taxonomy";
import type { ShopItemCard as ShopItemCardType } from "@/lib/supabase/shop";

export default function ShopItemCard({ item }: { item: ShopItemCardType }) {
  const category = getTaxonomyItem(shopCategories, item.category);
  const hasImage = localImageExists(item.image_path ?? undefined);

  return (
    <article className="border border-[#242721]/20 bg-[#f9f5ed]">
      {hasImage ? (
        <div className="relative aspect-square overflow-hidden bg-[#dce4e4]">
          <LocalImage src={item.image_path ?? undefined} alt="" sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw" />
          <span className="absolute inset-4 border border-[#f9f5ed]/55" aria-hidden="true" />
        </div>
      ) : null}
      <div className="p-5">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{category?.label ?? item.category}</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h2 className="font-serif text-2xl leading-tight tracking-[-0.025em] text-[#242721]"><Link href={`/shop/${item.slug}`} className="transition-colors hover:text-[#7b2430]">{item.title}</Link></h2>
          {item.price_label ? <span className="shrink-0 text-sm font-bold text-[#2d4737]">{item.price_label}</span> : null}
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#56584f]">{item.description}</p>
        <p className="mt-5 border-t border-[#242721]/15 pt-4 text-xs text-[#686a61]">From {item.seller_name}{item.is_affiliate ? " · Affiliate link" : ""}</p>
        <Link href={`/shop/${item.slug}`} className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View item</Link>
      </div>
    </article>
  );
}

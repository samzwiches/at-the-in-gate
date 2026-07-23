import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import LocalImage, { localImageExists } from "@/components/ui/LocalImage";
import PageContainer from "@/components/layout/PageContainer";
import { getShopItemBySlug } from "@/lib/supabase/shop";
import { getTaxonomyItem, shopCategories } from "@/lib/taxonomy";

type ShopItemPageProps = { params: Promise<{ slug: string }> };

export default async function ShopItemPage({ params }: ShopItemPageProps) {
  const { slug } = await params;
  const item = await getShopItemBySlug(slug);
  if (!item) notFound();
  const category = getTaxonomyItem(shopCategories, item.category);
  const hasImage = localImageExists(item.image_path ?? undefined);
  return <main className="bg-[#e7e1d5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: category?.label ?? "Shop", href: category ? `/shop/category/${category.slug}` : "/shop" }, { label: item.title }]} /><article className="mt-8 border border-[#242721]/20 bg-[#f9f5ed]">{hasImage ? <div className="relative aspect-[4/3] overflow-hidden bg-[#dce4e4]"><LocalImage src={item.image_path ?? undefined} alt="" sizes="(max-width: 1023px) 100vw, 896px" /><span className="absolute inset-4 border border-[#f9f5ed]/55" aria-hidden="true" /></div> : null}<div className="p-6 sm:p-9"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">{category?.label ?? item.category}</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{item.title}</h1><p className="mt-4 text-lg font-semibold text-[#2d4737]">From {item.seller_name}{item.price_label ? ` · ${item.price_label}` : ""}</p><p className="mt-8 whitespace-pre-wrap text-base leading-8 text-[#50564e]">{item.description}</p><section className="mt-8 border border-[#2d4737] bg-[#2d4737] p-5 text-[#f9f4eb] sm:p-6"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">External purchase</p><h2 className="mt-3 font-serif text-3xl leading-tight">Visit {item.seller_name} to purchase.</h2><p className="mt-3 text-sm leading-6 text-[#e2ddcf]">You will leave At The In Gate to complete this purchase with the seller.{item.is_affiliate ? " This is an affiliate link." : ""}</p><a href={item.destination_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Visit seller <span className="ml-2" aria-hidden="true">↗</span></a></section></div></article><Link href="/shop" className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to shop</Link></div></PageContainer></main>;
}

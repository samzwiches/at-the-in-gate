import Link from "next/link";
import ShopArchiveButton from "@/components/shop/ShopArchiveButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getShopItemsForOwner } from "@/lib/supabase/shop";

export default async function MyShopItemsPage() {
  const user = await requireUser("/shop/mine");
  const items = await getShopItemsForOwner(user.id);
  return <main className="bg-[#e7e1d5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: "My items" }]} /><p className="mt-8 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">My shop items</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your submissions.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">Track drafts, items in review, published links, and archived entries.</p>{items.length > 0 ? <div className="mt-8 space-y-4">{items.map((item) => <article key={item.id} className="flex flex-col gap-4 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{item.moderation_status}</p><h2 className="mt-2 font-serif text-2xl text-[#242721]"><Link href={`/shop/${item.slug}`} className="transition-colors hover:text-[#7b2430]">{item.title}</Link></h2><p className="mt-1 text-sm text-[#56584f]">{item.seller_name} · {item.price_label ?? "See seller"}</p></div><div className="flex flex-wrap gap-3"><Link href={`/shop/${item.slug}/edit`} className="inline-flex border border-[#2d4737] px-3 py-2 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Edit</Link>{item.moderation_status !== "archived" ? <ShopArchiveButton itemId={item.id} /> : null}</div></article>)}</div> : <div className="mt-8"><EmptyState eyebrow="Your trunk is clear" title="No shop items are attached to this account." description="Add an external seller item when the details are ready to share." action={<Link href="/shop/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Add a shop item <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}</div></PageContainer></main>;
}

import ShopItemForm from "@/components/shop/ShopItemForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";

export default async function NewShopItemPage() {
  await requireUser("/shop/new");
  return <main className="bg-[#e7e1d5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: "Add an item" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Add a shop item</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Share something worth passing along.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Save a draft while you assemble the details, or send the external seller link for review when it is ready.</p></header><ShopItemForm /></div></PageContainer></main>;
}

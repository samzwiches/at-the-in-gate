import Link from "next/link";
import { notFound } from "next/navigation";
import ShippingRouteForm from "@/components/shippers/ShippingRouteForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getDirectoryEntryById } from "@/lib/supabase/directory";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";
import { getShippingRouteBySlug } from "@/lib/supabase/shipping";

export default async function EditShippingRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/shippers/${slug}/edit`);
  const route = await getShippingRouteBySlug(slug);
  if (!route || route.moderation_status === "archived") notFound();
  const [shipper, shipperEntries] = await Promise.all([getDirectoryEntryById(route.directory_entry_id), getPublishedDirectoryEntryOptionsForOwner(user.id, "shippers")]);
  if (!shipper || shipper.owner_id !== user.id) notFound();
  return <main className="bg-[#eef1ed] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Shippers", href: "/shippers" }, { label: route.title, href: `/shippers/${route.slug}` }, { label: "Edit" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Edit shipping route</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Keep the route clear.</h1></header><ShippingRouteForm route={route} shipperEntries={shipperEntries} /><Link href={`/shippers/${route.slug}`} className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Back to route</Link></div></PageContainer></main>;
}

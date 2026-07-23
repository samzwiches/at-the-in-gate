import Link from "next/link";
import ShippingRouteArchiveButton from "@/components/shippers/ShippingRouteArchiveButton";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getDirectoryEntriesForOwner } from "@/lib/supabase/directory";
import { getShippingRoutesForOwnerDirectoryEntries } from "@/lib/supabase/shipping";

export default async function MyShippingRoutesPage() {
  const user = await requireUser("/shippers/mine");
  const entries = await getDirectoryEntriesForOwner(user.id);
  const routes = await getShippingRoutesForOwnerDirectoryEntries(entries.map((entry) => entry.id));
  return <main className="bg-[#eef1ed] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">My route board</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your shipping routes.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">Drafts, published routes, and archived route notes attached to your shipper identity.</p>{routes.length > 0 ? <div className="mt-8 space-y-4">{routes.map((route) => <article key={route.id} className="flex flex-col gap-4 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{route.moderation_status}</p><h2 className="mt-2 font-serif text-2xl text-[#242721]"><Link href={`/shippers/${route.slug}`} className="hover:text-[#7b2430]">{route.title}</Link></h2><p className="mt-1 text-sm text-[#56584f]">{route.origin} → {route.destination}</p></div><div className="flex flex-wrap gap-3"><Link href={`/shippers/${route.slug}/edit`} className="border border-[#2d4737] px-3 py-2 text-sm font-bold text-[#2d4737]">Edit</Link>{route.moderation_status !== "archived" ? <ShippingRouteArchiveButton routeId={route.id} /> : null}</div></article>)}</div> : <div className="mt-8"><EmptyState eyebrow="Your route board is clear" title="No shipping routes are attached to this account." description="Create an approved Shipper directory entry, then add the routes you are running." action={<Link href="/shippers/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Add a route</Link>} /></div>}</div></PageContainer></main>;
}

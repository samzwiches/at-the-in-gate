import Link from "next/link";
import ServiceArchiveButton from "@/components/services/ServiceArchiveButton";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getDirectoryEntriesForOwner } from "@/lib/supabase/directory";
import { getServiceOfferingsForOwnerDirectoryEntries } from "@/lib/supabase/services";

export default async function MyServicesPage() {
  const user = await requireUser("/services/mine");
  const entries = await getDirectoryEntriesForOwner(user.id);
  const services = await getServiceOfferingsForOwnerDirectoryEntries(entries.map((entry) => entry.id));
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">My service book</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your offerings.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">Drafts, submissions, published services, and archived records attached to your directory identity.</p>{services.length > 0 ? <div className="mt-8 space-y-4">{services.map((service) => <article key={service.id} className="flex flex-col gap-4 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{service.moderation_status}</p><h2 className="mt-2 font-serif text-2xl text-[#242721]"><Link href={`/services/${service.slug}`} className="hover:text-[#7b2430]">{service.title}</Link></h2><p className="mt-1 text-sm text-[#56584f]">{service.category.replaceAll("-", " ")}</p></div><div className="flex flex-wrap gap-3"><Link href={`/services/${service.slug}/edit`} className="border border-[#2d4737] px-3 py-2 text-sm font-bold text-[#2d4737]">Edit</Link>{service.moderation_status !== "archived" ? <ServiceArchiveButton serviceId={service.id} /> : null}</div></article>)}</div> : <div className="mt-8"><EmptyState eyebrow="Your service book is clear" title="No service offerings are attached to this account." description="Create an approved directory identity, then add the specific thing you provide." action={<Link href="/services/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Add a service</Link>} /></div>}</div></PageContainer></main>;
}

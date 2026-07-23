import Link from "next/link";
import { notFound } from "next/navigation";
import ServiceOfferingForm from "@/components/services/ServiceOfferingForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getDirectoryEntryById } from "@/lib/supabase/directory";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";
import { getServiceOfferingBySlug } from "@/lib/supabase/services";

export default async function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/services/${slug}/edit`);
  const service = await getServiceOfferingBySlug(slug);
  if (!service || service.moderation_status === "archived") notFound();
  const [directoryEntry, directoryEntries] = await Promise.all([getDirectoryEntryById(service.directory_entry_id), getPublishedDirectoryEntryOptionsForOwner(user.id)]);
  if (!directoryEntry || directoryEntry.owner_id !== user.id) notFound();
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: service.title, href: `/services/${service.slug}` }, { label: "Edit" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Edit service</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Keep the useful bits current.</h1></header><ServiceOfferingForm service={service} directoryEntries={directoryEntries} /><Link href={`/services/${service.slug}`} className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Back to service</Link></div></PageContainer></main>;
}

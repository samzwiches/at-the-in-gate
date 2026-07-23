import Link from "next/link";
import { notFound } from "next/navigation";
import DirectoryEntryForm from "@/components/directory/DirectoryEntryForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getDirectoryEntryBySlug } from "@/lib/supabase/directory";

type EditDirectoryEntryPageProps = { params: Promise<{ slug: string }> };

export default async function EditDirectoryEntryPage({ params }: EditDirectoryEntryPageProps) {
  const user = await requireUser("/directory/mine");
  const { slug } = await params;
  const entry = await getDirectoryEntryBySlug(slug);
  if (!entry || entry.owner_id !== user.id || entry.moderation_status === "archived") notFound();
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Directory", href: "/directory" }, { label: entry.name, href: `/directory/${entry.slug}` }, { label: "Edit" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Edit directory listing</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Keep the useful details current.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Changes sent for review return the listing to the moderation queue. Save a draft if you are still working through the details.</p></header><DirectoryEntryForm entry={entry} /><Link href={`/directory/${entry.slug}`} className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to listing</Link></div></PageContainer></main>;
}

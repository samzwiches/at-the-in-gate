import Link from "next/link";
import { notFound } from "next/navigation";
import JobForm from "@/components/jobs/JobForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getJobBySlug } from "@/lib/supabase/jobs";
import { getPublishedDirectoryEntryOptionsForOwner } from "@/lib/supabase/relationships";

type EditJobPageProps = { params: Promise<{ slug: string }> };

export default async function EditJobPage({ params }: EditJobPageProps) {
  const user = await requireUser("/jobs");
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job || job.owner_id !== user.id || job.moderation_status === "archived") {
    notFound();
  }

  const directoryEntries = await getPublishedDirectoryEntryOptionsForOwner(user.id);
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Jobs", href: "/jobs" }, { label: job.title, href: `/jobs/${job.slug}` }, { label: "Edit" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Edit job posting</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Keep the role clear.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Changes sent for review return the posting to the moderation queue. Save a draft if you are still working through the details.</p></header><JobForm job={job} directoryEntries={directoryEntries} /><Link href={`/jobs/${job.slug}`} className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to job</Link></div></PageContainer></main>;
}

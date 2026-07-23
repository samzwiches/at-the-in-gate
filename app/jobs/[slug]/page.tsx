import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RelatedEntityCard from "@/components/relationships/RelatedEntityCard";
import PageContainer from "@/components/layout/PageContainer";
import { getDirectoryEntryById } from "@/lib/supabase/directory";
import { formatEmploymentType, getJobBySlug } from "@/lib/supabase/jobs";
import { jobCategories } from "@/lib/taxonomy";

type JobDetailPageProps = { params: Promise<{ slug: string }> };

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();
  const category = jobCategories.find((item) => item.label === job.category);
  const employerDirectory = job.directory_entry_id ? await getDirectoryEntryById(job.directory_entry_id) : null;
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Jobs", href: "/jobs" }, { label: job.category, href: category ? `/jobs/category/${category.slug}` : "/jobs" }, { label: job.title }]} /><article className="mt-8 border border-[#242721]/20 bg-[#f9f5ed] p-6 sm:p-9"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">{job.category}</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{job.title}</h1><p className="mt-4 text-lg font-semibold text-[#2d4737]">{job.employer}</p><div className="mt-8 grid gap-px border border-[#242721]/15 sm:grid-cols-2"><div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Location</p><p className="mt-2 text-sm text-[#50564e]">{job.city}, {job.state}</p></div><div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Work details</p><p className="mt-2 text-sm text-[#50564e]">{formatEmploymentType(job.employment_type)}{job.housing_available ? " · Housing" : ""}{job.show_travel ? " · Show travel" : ""}</p></div></div><p className="mt-8 whitespace-pre-wrap text-base leading-8 text-[#50564e]">{job.description}</p><div className="mt-8 border-t border-[#242721]/15 pt-6"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Apply or ask a question</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#50564e]">{job.application_contact}</p></div></article>{employerDirectory ? <section className="mt-8"><RelatedEntityCard eyebrow="Employer directory listing" title={employerDirectory.name} detail={`${employerDirectory.city}, ${employerDirectory.state}`} href={`/directory/${employerDirectory.slug}`} /></section> : null}<Link href="/jobs" className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to jobs</Link></div></PageContainer></main>;
}

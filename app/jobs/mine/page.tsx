import Link from "next/link";
import JobArchiveButton from "@/components/jobs/JobArchiveButton";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getJobsForOwner } from "@/lib/supabase/jobs";

export default async function MyJobsPage() {
  const user = await requireUser("/jobs/mine");
  const jobs = await getJobsForOwner(user.id);
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">My job board</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your postings.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">Track drafts, roles in review, published openings, and archived postings.</p>{jobs.length > 0 ? <div className="mt-8 space-y-4">{jobs.map((job) => <article key={job.id} className="flex flex-col gap-4 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{job.moderation_status}</p><h2 className="mt-2 font-serif text-2xl text-[#242721]"><Link href={`/jobs/${job.slug}`} className="transition-colors hover:text-[#7b2430]">{job.title}</Link></h2><p className="mt-1 text-sm text-[#56584f]">{job.employer} · {job.city}, {job.state}</p></div><div className="flex flex-wrap gap-3"><Link href={`/jobs/${job.slug}/edit`} className="inline-flex border border-[#2d4737] px-3 py-2 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Edit</Link>{job.moderation_status !== "archived" ? <JobArchiveButton jobId={job.id} /> : null}</div></article>)}</div> : <div className="mt-8"><EmptyState eyebrow="Your board is clear" title="No roles are attached to this account." description="Post a role when you are ready to share the details." action={<Link href="/jobs/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Post a role <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}</div></PageContainer></main>;
}

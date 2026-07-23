import Link from "next/link";
import JobCard from "@/components/jobs/JobCard";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import { getPublishedJobs } from "@/lib/supabase/jobs";
import { jobCategories } from "@/lib/taxonomy";

export default async function JobsPage() {
  const jobs = await getPublishedJobs();
  const categoryItems = [{ label: "All roles", href: "/jobs" }, ...jobCategories.map((category) => ({ label: category.label, href: `/jobs/category/${category.slug}` }))];

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="jobs.hero">
          <header className="flex flex-col gap-7 border-b border-[#242721]/20 pb-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">Barn calls</p>
              <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Good work, good programs, clear expectations.</h1>
              <p className="mt-5 text-lg leading-8 text-[#56584f]">Roles submitted by the programs looking for a capable person at the rail, in the barn, or on the road.</p>
            </div>
            <div className="flex flex-wrap gap-3"><Link href="/jobs/new" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430]">Post a job <span className="ml-2" aria-hidden="true">↗</span></Link><Link href="/jobs/mine" className="inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">My postings</Link></div>
          </header>
        </PageHero>

        <section className="mt-7 border-y border-[#242721]/20 py-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Browse roles</p><div className="mt-3"><CategoryNav ariaLabel="Job categories" items={categoryItems} activeHref="/jobs" /></div></section>
        <section className="mt-10" aria-labelledby="jobs-title"><div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Open roles</p><h2 id="jobs-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">On the barn board.</h2></div><p className="text-sm font-semibold text-[#56584f]">{jobs.length} {jobs.length === 1 ? "role" : "roles"}</p></div>{jobs.length > 0 ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="mt-6"><EmptyState eyebrow="The board is clear" title="No approved roles are posted." description="Programs can send a role for review when they are ready to share the details." action={<Link href="/jobs/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Post a job <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}</section>
      </PageContainer>
    </main>
  );
}

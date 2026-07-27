import Link from "next/link";
import JobCard from "@/components/jobs/JobCard";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import { getPublishedJobs } from "@/lib/supabase/jobs";
import { jobCategories } from "@/lib/taxonomy";

export default async function JobsPage() {
  const jobs = await getPublishedJobs();
  const showCrewJobs = jobs.filter((job) => job.job_kind === "show_crew" && (job.crew_status === "open" || job.crew_status === "filled"));
  const standardJobs = jobs.filter((job) => job.job_kind !== "show_crew");
  const categoryItems = [{ label: "All roles", href: "/jobs" }, ...jobCategories.map((category) => ({ label: category.label, href: `/jobs/category/${category.slug}` }))];

  return (
    <PageCanvas appearanceKey="jobs.page" tone="cream" className="py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="jobs.hero">
          <header className="flex flex-col gap-7 border-b border-[#242721]/20 pb-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">Barn calls and show week help</p>
              <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Good work, good people, clear expectations.</h1>
              <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Find a long-term barn role or the extra hands that keep a specific horse show moving.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs/new?kind=show-crew" className="inline-flex border border-[#7b2430] bg-[#7b2430] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#2d4737]">Need show help? <span className="ml-2" aria-hidden="true">↗</span></Link>
              <Link href="/jobs/new" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#7b2430]">Post a job <span className="ml-2" aria-hidden="true">↗</span></Link>
              <Link href="/jobs/mine" className="inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">My postings</Link>
            </div>
          </header>
        </PageHero>

        <section className="mt-8 border border-[#7b2430]/25 bg-[#f9f5ed] p-5 sm:p-7" aria-labelledby="show-crew-title">
          <div className="flex flex-col gap-5 border-b border-[#242721]/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Show Crew</p>
              <h2 id="show-crew-title" className="mt-2 font-serif text-4xl tracking-[-0.035em] text-[#242721]">Extra hands for a specific show.</h2>
              <p className="mt-3 text-sm leading-7 text-[#56584f]">Requests are tied to the calendar with exact dates, tasks, experience needs, housing, transportation, and pay. Applicants respond privately through At The In Gate.</p>
            </div>
            <Link href="/jobs/new?kind=show-crew" className="inline-flex shrink-0 border-b border-[#7b2430] pb-1 text-sm font-bold text-[#7b2430]">Post a Show Crew request</Link>
          </div>
          {showCrewJobs.length > 0 ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{showCrewJobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="mt-6"><EmptyState eyebrow="The show board is clear" title="No active Show Crew requests are posted." description="Post the first request when your barn needs grooming, ring help, night checks, setup, or another capable set of hands at a show." action={<Link href="/jobs/new?kind=show-crew" className="inline-flex border-b border-[#7b2430] pb-1 text-sm font-bold text-[#7b2430]">Post show help <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}
        </section>

        <section className="mt-9 border-y border-[#242721]/20 py-4">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Browse longer-term roles</p>
          <div className="mt-3"><CategoryNav ariaLabel="Job categories" items={categoryItems} activeHref="/jobs" /></div>
        </section>

        <section className="mt-10" aria-labelledby="jobs-title">
          <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4">
            <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Open roles</p><h2 id="jobs-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">On the barn board.</h2></div>
            <p className="text-sm font-semibold text-[#56584f]">{standardJobs.length} {standardJobs.length === 1 ? "role" : "roles"}</p>
          </div>
          {standardJobs.length > 0 ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{standardJobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="mt-6"><EmptyState eyebrow="The board is clear" title="No approved roles are posted." description="Programs can send a role for review when they are ready to share the details." action={<Link href="/jobs/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Post a job <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}
        </section>
      </PageContainer>
    </PageCanvas>
  );
}

import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import JobCard from "@/components/jobs/JobCard";
import PageContainer from "@/components/layout/PageContainer";
import { getPublishedJobsForCategory } from "@/lib/supabase/jobs";
import { getTaxonomyItem, jobCategories } from "@/lib/taxonomy";

type JobCategoryPageProps = { params: Promise<{ categorySlug: string }> };

export default async function JobCategoryPage({ params }: JobCategoryPageProps) {
  const { categorySlug } = await params;
  const category = getTaxonomyItem(jobCategories, categorySlug);
  if (!category) notFound();
  const jobs = await getPublishedJobsForCategory(category.label);
  const categoryItems = [{ label: "All roles", href: "/jobs" }, ...jobCategories.map((item) => ({ label: item.label, href: `/jobs/category/${item.slug}` }))];
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-6xl"><Breadcrumbs items={[{ label: "Jobs", href: "/jobs" }, { label: category.label }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Job category</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{category.label}.</h1></header><div className="mt-6"><CategoryNav ariaLabel="Job categories" items={categoryItems} activeHref={`/jobs/category/${category.slug}`} /></div>{jobs.length > 0 ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="mt-10"><EmptyState eyebrow="No matching roles" title={`No approved ${category.label.toLowerCase()} roles are posted.`} description="New roles appear here after review." /></div>}</div></PageContainer></main>;
}

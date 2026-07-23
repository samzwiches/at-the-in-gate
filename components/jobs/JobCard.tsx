import Link from "next/link";
import type { JobCard as JobCardType } from "@/lib/supabase/jobs";
import { formatEmploymentType } from "@/lib/supabase/jobs";

export default function JobCard({ job }: { job: JobCardType }) {
  return <article className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{job.category}</p><span className="text-lg text-[#2d4737]" aria-hidden="true">↗</span></div><h3 className="mt-7 font-serif text-3xl tracking-[-0.03em] text-[#242721]"><Link href={`/jobs/${job.slug}`} className="transition-colors hover:text-[#7b2430]">{job.title}</Link></h3><p className="mt-2 text-sm font-semibold text-[#2d4737]">{job.employer}</p><p className="mt-4 line-clamp-3 text-sm leading-6 text-[#56584f]">{job.description}</p><div className="mt-6 border-t border-[#242721]/15 pt-4 text-xs text-[#686a61]"><p>{job.city}, {job.state}</p><p className="mt-1">{formatEmploymentType(job.employment_type)}{job.housing_available ? " · Housing" : ""}{job.show_travel ? " · Show travel" : ""}</p></div><Link href={`/jobs/${job.slug}`} className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View role</Link></article>;
}

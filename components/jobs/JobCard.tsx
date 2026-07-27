import Link from "next/link";
import type { JobCard as JobCardType } from "@/lib/supabase/jobs";
import { formatEmploymentType, formatShowCrewPay } from "@/lib/supabase/jobs";
import { formatEventDates } from "@/lib/supabase/events";

function crewStatusLabel(status: string) {
  if (status === "filled") return "Crew chosen";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Help needed";
}

export default function JobCard({ job }: { job: JobCardType }) {
  const isShowCrew = job.job_kind === "show_crew";

  return (
    <article className={`border bg-[#f9f5ed] p-5 sm:p-6 ${job.is_urgent && isShowCrew ? "border-[#7b2430]" : "border-[#242721]/20"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{isShowCrew ? "Show Crew" : job.category}</p>
          {isShowCrew ? <span className="border border-[#2d4737]/25 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#2d4737]">{crewStatusLabel(job.crew_status)}</span> : null}
          {job.is_urgent && isShowCrew ? <span className="bg-[#7b2430] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#f9f5ed]">Urgent</span> : null}
        </div>
        <span className="text-lg text-[#2d4737]" aria-hidden="true">↗</span>
      </div>
      <h3 className="mt-7 font-serif text-3xl tracking-[-0.03em] text-[#242721]"><Link href={`/jobs/${job.slug}`} className="transition-colors hover:text-[#7b2430]">{job.title}</Link></h3>
      <p className="mt-2 text-sm font-semibold text-[#2d4737]">{job.employer}</p>
      {isShowCrew && job.work_start_date && job.work_end_date ? <p className="mt-4 text-sm font-bold text-[#7b2430]">{formatEventDates(job.work_start_date, job.work_end_date)}</p> : null}
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#56584f]">{job.description}</p>
      <div className="mt-6 border-t border-[#242721]/15 pt-4 text-xs text-[#686a61]">
        <p>{job.city}, {job.state}</p>
        {isShowCrew ? (
          <>
            <p className="mt-1">{formatShowCrewPay(job.pay_type, job.pay_amount_cents)}</p>
            {job.time_blocks.length > 0 ? <p className="mt-1">{job.time_blocks.join(" · ")}</p> : null}
          </>
        ) : <p className="mt-1">{formatEmploymentType(job.employment_type)}{job.housing_available ? " · Housing" : ""}{job.show_travel ? " · Show travel" : ""}</p>}
      </div>
      <Link href={`/jobs/${job.slug}`} className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">{isShowCrew ? "View help request" : "View role"}</Link>
    </article>
  );
}

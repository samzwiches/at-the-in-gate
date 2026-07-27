import Link from "next/link";
import { notFound } from "next/navigation";
import { withdrawShowCrewApplication } from "@/app/jobs/show-crew-actions";
import ShowCrewApplicationForm from "@/components/jobs/ShowCrewApplicationForm";
import ShowCrewApplicationsPanel from "@/components/jobs/ShowCrewApplicationsPanel";
import PageContainer from "@/components/layout/PageContainer";
import RelatedEntityCard from "@/components/relationships/RelatedEntityCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { getDirectoryEntryById } from "@/lib/supabase/directory";
import { formatEventDates, getEventById } from "@/lib/supabase/events";
import { formatEmploymentType, formatExperienceLevel, formatShowCrewPay, getJobBySlug } from "@/lib/supabase/jobs";
import { getShowCrewApplicationForApplicant, getShowCrewApplicationsForOwner } from "@/lib/supabase/show-crew";
import { jobCategories } from "@/lib/taxonomy";

type JobDetailPageProps = { params: Promise<{ slug: string }> };

function crewStatusLabel(status: string) {
  if (status === "filled") return "Crew chosen";
  if (status === "completed") return "Work completed";
  if (status === "cancelled") return "Request cancelled";
  return "Accepting applications";
}

function applicationStatusMessage(status: string) {
  if (status === "accepted") return "You were selected for this Show Crew request.";
  if (status === "rejected") return "The poster selected someone else for this request.";
  if (status === "withdrawn") return "You withdrew your application.";
  return "Your application is with the poster.";
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const [job, user] = await Promise.all([getJobBySlug(slug), getAuthenticatedUser()]);
  if (!job) notFound();

  const isShowCrew = job.job_kind === "show_crew";
  const isOwner = user?.id === job.owner_id;
  const category = jobCategories.find((item) => item.label === job.category);
  const [employerDirectory, event, currentApplication, ownerApplications] = await Promise.all([
    job.directory_entry_id ? getDirectoryEntryById(job.directory_entry_id) : Promise.resolve(null),
    isShowCrew && job.event_id ? getEventById(job.event_id) : Promise.resolve(null),
    isShowCrew && user && !isOwner ? getShowCrewApplicationForApplicant(job.id, user.id) : Promise.resolve(null),
    isShowCrew && user && isOwner ? getShowCrewApplicationsForOwner(job.id, user.id) : Promise.resolve([]),
  ]);

  const categoryHref = category ? `/jobs/category/${category.slug}` : "/jobs";
  const canSeePrivateContact = !isShowCrew || isOwner || currentApplication?.status === "accepted";
  const canApply = isShowCrew && Boolean(user) && !isOwner && job.crew_status === "open" && !currentApplication;

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs items={[{ label: "Jobs", href: "/jobs" }, ...(isShowCrew ? [{ label: "Show Crew", href: "/jobs#show-crew-title" }] : [{ label: job.category, href: categoryHref }]), { label: job.title }]} />

          <article className={`mt-8 border bg-[#f9f5ed] p-6 sm:p-9 ${job.is_urgent && isShowCrew ? "border-[#7b2430]" : "border-[#242721]/20"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">{isShowCrew ? "Show Crew" : job.category}</p>
              {isShowCrew ? <span className="border border-[#2d4737]/30 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#2d4737]">{crewStatusLabel(job.crew_status)}</span> : null}
              {job.is_urgent && isShowCrew ? <span className="bg-[#7b2430] px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#f9f5ed]">Urgent</span> : null}
            </div>
            <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{job.title}</h1>
            <p className="mt-4 text-lg font-semibold text-[#2d4737]">{job.employer}</p>

            {isShowCrew ? (
              <>
                {event ? <div className="mt-7 border border-[#7b2430]/20 bg-[#f4efe5] p-5"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Connected show</p><h2 className="mt-2 font-serif text-2xl text-[#242721]"><Link href={`/events/show/${event.slug}`} className="transition-colors hover:text-[#7b2430]">{event.title}</Link></h2><p className="mt-2 text-sm text-[#56584f]">{formatEventDates(event.start_date, event.end_date)} · {event.venue} · {event.city}, {event.state}</p></div> : null}
                <div className="mt-7 grid gap-px border border-[#242721]/15 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Work dates</p><p className="mt-2 text-sm text-[#50564e]">{job.work_start_date && job.work_end_date ? formatEventDates(job.work_start_date, job.work_end_date) : "See description"}</p></div>
                  <div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Pay</p><p className="mt-2 text-sm text-[#50564e]">{formatShowCrewPay(job.pay_type, job.pay_amount_cents)}</p></div>
                  <div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Experience</p><p className="mt-2 text-sm text-[#50564e]">{formatExperienceLevel(job.experience_level)}</p></div>
                  <div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Time blocks</p><p className="mt-2 text-sm text-[#50564e]">{job.time_blocks.join(" · ")}</p></div>
                  <div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Horses</p><p className="mt-2 text-sm text-[#50564e]">{job.horse_count ? `${job.horse_count} ${job.horse_count === 1 ? "horse" : "horses"}` : "Not specified"}</p></div>
                  <div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Practical details</p><p className="mt-2 text-sm text-[#50564e]">{[job.housing_available ? "Housing" : null, job.transportation_available ? "Transportation" : null].filter(Boolean).join(" · ") || "Arrange directly"}</p></div>
                </div>
                <div className="mt-7"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Help needed</p><div className="mt-3 flex flex-wrap gap-2">{job.task_tags.map((task) => <span key={task} className="border border-[#2d4737]/25 bg-[#f4efe5] px-3 py-1.5 text-xs font-semibold text-[#2d4737]">{task}</span>)}</div></div>
              </>
            ) : (
              <div className="mt-8 grid gap-px border border-[#242721]/15 sm:grid-cols-2"><div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Location</p><p className="mt-2 text-sm text-[#50564e]">{job.city}, {job.state}</p></div><div className="bg-[#f4efe5] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Work details</p><p className="mt-2 text-sm text-[#50564e]">{formatEmploymentType(job.employment_type)}{job.housing_available ? " · Housing" : ""}{job.show_travel ? " · Show travel" : ""}</p></div></div>
            )}

            <p className="mt-8 whitespace-pre-wrap text-base leading-8 text-[#50564e]">{job.description}</p>

            {canSeePrivateContact ? <div className="mt-8 border-t border-[#242721]/15 pt-6"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{isShowCrew ? "Private contact" : "Apply or ask a question"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#50564e]">{job.application_contact}</p></div> : null}
          </article>

          {employerDirectory ? <section className="mt-8"><RelatedEntityCard eyebrow="Employer directory listing" title={employerDirectory.name} detail={`${employerDirectory.city}, ${employerDirectory.state}`} href={`/directory/${employerDirectory.slug}`} /></section> : null}

          {isShowCrew && isOwner ? <ShowCrewApplicationsPanel jobId={job.id} jobSlug={job.slug} crewStatus={job.crew_status} applications={ownerApplications} /> : null}

          {isShowCrew && !isOwner ? (
            <section className="mt-10">
              {currentApplication ? (
                <div className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Your application</p>
                  <h2 className="mt-3 font-serif text-3xl text-[#242721]">{applicationStatusMessage(currentApplication.status)}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#56584f]">Status: <strong className="text-[#2d4737]">{currentApplication.status}</strong></p>
                  {currentApplication.status === "pending" ? <form action={withdrawShowCrewApplication} className="mt-5"><input type="hidden" name="applicationId" value={currentApplication.id} /><input type="hidden" name="jobSlug" value={job.slug} /><button className="border border-[#7b2430] px-4 py-2.5 text-sm font-bold text-[#7b2430] transition-colors hover:bg-[#7b2430] hover:text-[#f9f5ed]">Withdraw application</button></form> : null}
                </div>
              ) : canApply ? <ShowCrewApplicationForm jobId={job.id} /> : !user && job.crew_status === "open" ? <div className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Offer to help</p><h2 className="mt-3 font-serif text-3xl text-[#242721]">Sign in to contact the barn through Show Crew.</h2><Link href={`/sign-in?${new URLSearchParams({ next: `/jobs/${job.slug}` })}`} className="mt-5 inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430]">Sign in</Link></div> : <div className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7"><p className="text-sm leading-7 text-[#56584f]">This request is not accepting new applications.</p></div>}
            </section>
          ) : null}

          <Link href="/jobs" className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to jobs</Link>
        </div>
      </PageContainer>
    </main>
  );
}

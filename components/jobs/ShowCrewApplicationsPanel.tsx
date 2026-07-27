import { setShowCrewJobStatus, updateShowCrewApplicationStatus } from "@/app/jobs/show-crew-actions";
import type { ShowCrewApplicationWithApplicant, ShowCrewStatus } from "@/lib/supabase/show-crew";

function applicantName(application: ShowCrewApplicationWithApplicant) {
  return application.applicant?.display_name || application.applicant?.username || "At The In Gate member";
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ShowCrewApplicationsPanel({
  jobId,
  jobSlug,
  crewStatus,
  applications,
}: {
  jobId: string;
  jobSlug: string;
  crewStatus: ShowCrewStatus;
  applications: ShowCrewApplicationWithApplicant[];
}) {
  return (
    <section className="mt-10 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#242721]/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Poster controls</p>
          <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Show Crew applications.</h2>
        </div>
        <span className="text-sm font-bold text-[#2d4737]">{applications.length} {applications.length === 1 ? "applicant" : "applicants"}</span>
      </div>

      {applications.length > 0 ? (
        <div className="mt-6 grid gap-5">
          {applications.map((application) => (
            <article key={application.id} className="border border-[#242721]/15 bg-[#f4efe5] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-2xl text-[#242721]">{applicantName(application)}</h3>
                  <p className="mt-1 text-xs text-[#686a61]">{application.applicant?.location || "Location not listed"}</p>
                </div>
                <span className="border border-[#2d4737]/30 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#2d4737]">{statusLabel(application.status)}</span>
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#50564e]">{application.message}</p>
              <div className="mt-5 border-t border-[#242721]/15 pt-4">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Private contact</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#2d4737]">{application.contact_details}</p>
              </div>
              {application.status === "pending" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <form action={updateShowCrewApplicationStatus}>
                    <input type="hidden" name="jobId" value={jobId} />
                    <input type="hidden" name="jobSlug" value={jobSlug} />
                    <input type="hidden" name="applicationId" value={application.id} />
                    <button name="status" value="accepted" className="border border-[#2d4737] bg-[#2d4737] px-4 py-2 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430]">Choose this person</button>
                  </form>
                  <form action={updateShowCrewApplicationStatus}>
                    <input type="hidden" name="jobId" value={jobId} />
                    <input type="hidden" name="jobSlug" value={jobSlug} />
                    <input type="hidden" name="applicationId" value={application.id} />
                    <button name="status" value="rejected" className="border border-[#2d4737] px-4 py-2 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Pass for this job</button>
                  </form>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm leading-7 text-[#56584f]">No one has offered to help yet. The request remains visible while its status is open.</p>
      )}

      <div className="mt-7 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5">
        {crewStatus !== "completed" ? (
          <form action={setShowCrewJobStatus}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="jobSlug" value={jobSlug} />
            <button name="crewStatus" value="completed" className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430]">Mark work completed</button>
          </form>
        ) : null}
        {crewStatus !== "cancelled" ? (
          <form action={setShowCrewJobStatus}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="jobSlug" value={jobSlug} />
            <button name="crewStatus" value="cancelled" className="border border-[#7b2430] px-4 py-2.5 text-sm font-bold text-[#7b2430] transition-colors hover:bg-[#7b2430] hover:text-[#f9f5ed]">Cancel request</button>
          </form>
        ) : null}
        {crewStatus === "cancelled" ? (
          <form action={setShowCrewJobStatus}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="jobSlug" value={jobSlug} />
            <button name="crewStatus" value="open" className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Reopen request</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import { useActionState } from "react";
import { submitShowCrewFeedback } from "@/app/jobs/show-crew-actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

function RatingSelect({ name, label }: { name: string; label: string }) {
  return (
    <label className={labelClassName}>
      {label}
      <select name={name} required defaultValue="5" className={inputClassName}>
        <option value="5">5 · Excellent</option>
        <option value="4">4 · Very good</option>
        <option value="3">3 · Solid</option>
        <option value="2">2 · Needs improvement</option>
        <option value="1">1 · Poor</option>
      </select>
    </label>
  );
}

export default function ShowCrewFeedbackForm({
  jobId,
  jobSlug,
  applicationId,
  workerName,
}: {
  jobId: string;
  jobSlug: string;
  applicationId: string;
  workerName: string;
}) {
  const [state, formAction, pending] = useActionState(submitShowCrewFeedback, initialFormActionState);

  return (
    <form action={formAction} className="mt-7 border border-[#b08d57]/40 bg-[#efe8dc] p-5 sm:p-7">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="jobSlug" value={jobSlug} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Verified Show Crew review</p>
      <h3 className="mt-3 font-serif text-3xl text-[#242721]">How did {workerName} do?</h3>
      <p className="mt-3 text-sm leading-7 text-[#56584f]">This is tied to the accepted application and completed job, so readers can distinguish it from an unverified barn-aisle opinion.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <RatingSelect name="rating" label="Overall" />
        <RatingSelect name="reliabilityRating" label="Reliability" />
        <RatingSelect name="communicationRating" label="Communication" />
        <RatingSelect name="horseCareRating" label="Horse care" />
      </div>
      <label className={`mt-5 block ${labelClassName}`}>
        What should another barn know?
        <textarea name="body" required maxLength={3000} rows={5} className={inputClassName} />
      </label>
      <label className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2d4737]"><input type="checkbox" name="wouldHireAgain" defaultChecked /> I would hire this person again</label>
      <button type="submit" disabled={pending} className="mt-6 border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Publishing…" : "Publish verified review"}</button>
      <FormFeedback state={state} />
    </form>
  );
}

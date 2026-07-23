"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/app/jobs/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";
import { jobCategories } from "@/lib/taxonomy";
import type { RelationshipPickerOption } from "@/lib/relationships";

type JobValues = {
  id: string;
  title: string;
  employer: string;
  category: string;
  city: string;
  state: string;
  employment_type: string;
  housing_available: boolean;
  show_travel: boolean;
  description: string;
  application_contact: string;
  directory_entry_id: string | null;
};

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function JobForm({ job, directoryEntries = [] }: { job?: JobValues; directoryEntries?: RelationshipPickerOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = job ? updateJob : createJob;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      if (!job) formRef.current?.reset();
      router.refresh();
    }
  }, [job, router, state.status]);

  const buttonPrefix = job ? "Update" : "Save";

  return (
    <form ref={formRef} action={formAction} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      {job ? <input type="hidden" name="jobId" value={job.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>Role title<input name="title" required maxLength={180} defaultValue={job?.title} className={inputClassName} /></label>
        <label className={labelClassName}>Program or employer<input name="employer" required maxLength={180} defaultValue={job?.employer} className={inputClassName} /></label>
        <label className={labelClassName}>Employer directory listing <span className="font-normal text-[#686a61]">(optional)</span><select name="directoryEntryId" defaultValue={job?.directory_entry_id ?? ""} className={inputClassName}><option value="">Keep employer as written above</option>{directoryEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.category ? ` · ${entry.category}` : ""}</option>)}</select></label>
        <label className={labelClassName}>Category<select name="category" required defaultValue={job?.category ?? ""} className={inputClassName}><option value="" disabled>Choose one</option>{jobCategories.map((category) => <option key={category.slug} value={category.label}>{category.label}</option>)}</select></label>
        <label className={labelClassName}>Employment type<select name="employmentType" required defaultValue={job?.employment_type ?? ""} className={inputClassName}><option value="" disabled>Choose one</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="seasonal">Seasonal</option><option value="contract">Contract</option></select></label>
        <label className={labelClassName}>City<input name="city" required maxLength={100} defaultValue={job?.city} className={inputClassName} /></label>
        <label className={labelClassName}>State<input name="state" required maxLength={80} defaultValue={job?.state} className={inputClassName} /></label>
      </div>
      <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-[#2d4737]"><label className="inline-flex items-center gap-2"><input type="checkbox" name="housingAvailable" defaultChecked={job?.housing_available} /> Housing available</label><label className="inline-flex items-center gap-2"><input type="checkbox" name="showTravel" defaultChecked={job?.show_travel} /> Show travel</label></div>
      <label className={`mt-5 block ${labelClassName}`}>Role description<textarea name="description" required maxLength={10000} rows={8} defaultValue={job?.description} className={inputClassName} /></label>
      <label className={`mt-5 block ${labelClassName}`}>Application contact<input name="applicationContact" required maxLength={500} defaultValue={job?.application_contact} placeholder="Email address, phone number, or application link" className={inputClassName} /></label>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5"><button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{buttonPrefix} draft</button><button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : job ? "Send changes for review" : "Send for review"}</button></div>
      <FormFeedback state={state} />
    </form>
  );
}

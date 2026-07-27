"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/app/jobs/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";
import { jobCategories } from "@/lib/taxonomy";
import type { RelationshipPickerOption } from "@/lib/relationships";
import type { JobKind, ShowCrewExperienceLevel, ShowCrewPayType, ShowCrewStatus } from "@/lib/supabase/show-crew";

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
  job_kind: JobKind;
  event_id: string | null;
  work_start_date: string | null;
  work_end_date: string | null;
  time_blocks: string[];
  task_tags: string[];
  horse_count: number | null;
  experience_level: ShowCrewExperienceLevel | null;
  transportation_available: boolean;
  pay_amount_cents: number | null;
  pay_type: ShowCrewPayType | null;
  is_urgent: boolean;
  crew_status: ShowCrewStatus;
};

type EventOption = {
  id: string;
  title: string;
  city: string;
  state: string;
  start_date: string;
  end_date: string;
};

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";
const checkboxClassName = "inline-flex items-center gap-2 border border-[#242721]/15 bg-[#f9f5ed] px-3 py-2.5 text-sm font-semibold text-[#2d4737]";

const timeBlockOptions = ["Morning", "Afternoon", "Evening", "Full day"];
const taskOptions = [
  "Grooming",
  "Stall setup and cleaning",
  "Tacking and untacking",
  "Lunging",
  "Ring help",
  "Holding horses",
  "Braiding",
  "Body clipping",
  "Night checks",
  "Unloading and setup",
  "Pony kid help",
  "Jump crew",
];

function eventDateLabel(event: EventOption) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const start = formatter.format(new Date(`${event.start_date}T12:00:00`));
  const end = formatter.format(new Date(`${event.end_date}T12:00:00`));
  return event.start_date === event.end_date ? start : `${start} to ${end}`;
}

export default function JobForm({
  job,
  directoryEntries = [],
  events = [],
  initialJobKind = "standard",
  initialEventId = "",
}: {
  job?: JobValues;
  directoryEntries?: RelationshipPickerOption[];
  events?: EventOption[];
  initialJobKind?: JobKind;
  initialEventId?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = job ? updateJob : createJob;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);
  const [jobKind, setJobKind] = useState<JobKind>(job?.job_kind ?? initialJobKind);
  const [selectedEventId, setSelectedEventId] = useState(job?.event_id ?? initialEventId);
  const [payType, setPayType] = useState<ShowCrewPayType>(job?.pay_type ?? "total");

  useEffect(() => {
    if (state.status === "success") {
      if (!job) formRef.current?.reset();
      router.refresh();
    }
  }, [job, router, state.status]);

  const buttonPrefix = job ? "Update" : "Save";
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const payAmount = job?.pay_amount_cents === null || job?.pay_amount_cents === undefined ? "" : (job.pay_amount_cents / 100).toFixed(job.pay_amount_cents % 100 === 0 ? 0 : 2);

  return (
    <form ref={formRef} action={formAction} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      {job ? <input type="hidden" name="jobId" value={job.id} /> : null}

      <fieldset>
        <legend className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">What are you posting?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={`cursor-pointer border p-4 transition-colors ${jobKind === "standard" ? "border-[#2d4737] bg-[#f9f5ed]" : "border-[#242721]/20 bg-[#efe8dc]"}`}>
            <input type="radio" name="jobKind" value="standard" checked={jobKind === "standard"} onChange={() => setJobKind("standard")} className="sr-only" />
            <span className="font-serif text-2xl text-[#242721]">Barn job</span>
            <span className="mt-2 block text-sm leading-6 text-[#56584f]">Full-time, part-time, seasonal, or contract work.</span>
          </label>
          <label className={`cursor-pointer border p-4 transition-colors ${jobKind === "show_crew" ? "border-[#7b2430] bg-[#f9f5ed]" : "border-[#242721]/20 bg-[#efe8dc]"}`}>
            <input type="radio" name="jobKind" value="show_crew" checked={jobKind === "show_crew"} onChange={() => setJobKind("show_crew")} className="sr-only" />
            <span className="font-serif text-2xl text-[#242721]">Show Crew request</span>
            <span className="mt-2 block text-sm leading-6 text-[#56584f]">Specific help tied to a show, date, task list, and pay arrangement.</span>
          </label>
        </div>
      </fieldset>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>{jobKind === "show_crew" ? "Help request title" : "Role title"}<input name="title" required maxLength={180} defaultValue={job?.title} placeholder={jobKind === "show_crew" ? "Saturday morning groom for three ponies" : "Assistant trainer"} className={inputClassName} /></label>
        <label className={labelClassName}>{jobKind === "show_crew" ? "Barn or program" : "Program or employer"}<input name="employer" required maxLength={180} defaultValue={job?.employer} className={inputClassName} /></label>
        <label className={labelClassName}>Directory listing <span className="font-normal text-[#686a61]">(optional)</span><select name="directoryEntryId" defaultValue={job?.directory_entry_id ?? ""} className={inputClassName}><option value="">Keep the name as written above</option>{directoryEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.category ? ` · ${entry.category}` : ""}</option>)}</select></label>
      </div>

      {jobKind === "standard" ? (
        <section className="mt-7 border-t border-[#242721]/15 pt-6">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Role details</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>Category<select name="category" required defaultValue={job?.job_kind === "standard" ? job.category : ""} className={inputClassName}><option value="" disabled>Choose one</option>{jobCategories.map((category) => <option key={category.slug} value={category.label}>{category.label}</option>)}</select></label>
            <label className={labelClassName}>Employment type<select name="employmentType" required defaultValue={job?.job_kind === "standard" ? job.employment_type : ""} className={inputClassName}><option value="" disabled>Choose one</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="seasonal">Seasonal</option><option value="contract">Contract</option></select></label>
            <label className={labelClassName}>City<input name="city" required maxLength={100} defaultValue={job?.job_kind === "standard" ? job.city : ""} className={inputClassName} /></label>
            <label className={labelClassName}>State<input name="state" required maxLength={80} defaultValue={job?.job_kind === "standard" ? job.state : ""} className={inputClassName} /></label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3"><label className={checkboxClassName}><input type="checkbox" name="housingAvailable" defaultChecked={job?.housing_available} /> Housing available</label><label className={checkboxClassName}><input type="checkbox" name="showTravel" defaultChecked={job?.show_travel} /> Show travel</label></div>
        </section>
      ) : (
        <section className="mt-7 border-t border-[#242721]/15 pt-6">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Show and schedule</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className={`${labelClassName} sm:col-span-2`}>Show<select name="eventId" required value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)} className={inputClassName}><option value="" disabled>Choose a published show</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title} · {event.city}, {event.state} · {eventDateLabel(event)}</option>)}</select></label>
            <label className={labelClassName}>First work date<input type="date" name="workStartDate" required defaultValue={job?.work_start_date ?? ""} min={selectedEvent?.start_date} max={selectedEvent?.end_date} className={inputClassName} /></label>
            <label className={labelClassName}>Final work date<input type="date" name="workEndDate" required defaultValue={job?.work_end_date ?? ""} min={selectedEvent?.start_date} max={selectedEvent?.end_date} className={inputClassName} /></label>
            <label className={labelClassName}>Number of horses <span className="font-normal text-[#686a61]">(optional)</span><input type="number" name="horseCount" min={1} max={100} defaultValue={job?.horse_count ?? ""} className={inputClassName} /></label>
            <label className={labelClassName}>Experience needed<select name="experienceLevel" required defaultValue={job?.experience_level ?? "any"} className={inputClassName}><option value="any">Any appropriate experience</option><option value="beginner">Beginner welcome</option><option value="intermediate">Intermediate</option><option value="experienced">Experienced</option><option value="professional">Professional</option></select></label>
          </div>

          <fieldset className="mt-6">
            <legend className={labelClassName}>Time blocks</legend>
            <div className="mt-3 flex flex-wrap gap-3">{timeBlockOptions.map((option) => <label key={option} className={checkboxClassName}><input type="checkbox" name="timeBlocks" value={option} defaultChecked={job?.time_blocks.includes(option)} /> {option}</label>)}</div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className={labelClassName}>Help needed</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{taskOptions.map((option) => <label key={option} className={checkboxClassName}><input type="checkbox" name="taskTags" value={option} defaultChecked={job?.task_tags.includes(option)} /> {option}</label>)}</div>
          </fieldset>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>Pay arrangement<select name="payType" required value={payType} onChange={(event) => setPayType(event.target.value as ShowCrewPayType)} className={inputClassName}><option value="total">Total for the job</option><option value="daily">Per day</option><option value="hourly">Per hour</option><option value="negotiable">Negotiable</option><option value="unpaid">Volunteer help</option></select></label>
            {payType === "total" || payType === "daily" || payType === "hourly" ? <label className={labelClassName}>Amount in USD<input type="number" name="payAmount" min={0} step="0.01" required defaultValue={payAmount} placeholder="150" className={inputClassName} /></label> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-3"><label className={checkboxClassName}><input type="checkbox" name="housingAvailable" defaultChecked={job?.housing_available} /> Housing available</label><label className={checkboxClassName}><input type="checkbox" name="transportationAvailable" defaultChecked={job?.transportation_available} /> Transportation available</label><label className={checkboxClassName}><input type="checkbox" name="isUrgent" defaultChecked={job?.is_urgent} /> Urgent request</label></div>
        </section>
      )}

      <label className={`mt-7 block ${labelClassName}`}>{jobKind === "show_crew" ? "What the helper needs to know" : "Role description"}<textarea name="description" required maxLength={10000} rows={8} defaultValue={job?.description} className={inputClassName} /></label>
      <label className={`mt-5 block ${labelClassName}`}>{jobKind === "show_crew" ? "Private contact released to the selected helper" : "Application contact"}<input name="applicationContact" required maxLength={500} defaultValue={job?.application_contact} placeholder="Email address, phone number, or both" className={inputClassName} /></label>
      {jobKind === "show_crew" ? <p className="mt-2 text-xs leading-5 text-[#686a61]">This contact is not displayed publicly. Applicants send their information through At The In Gate.</p> : null}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5"><button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{buttonPrefix} draft</button><button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : job ? "Send changes for review" : "Send for review"}</button></div>
      <FormFeedback state={state} />
    </form>
  );
}

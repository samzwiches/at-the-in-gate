"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/app/events/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";
import { eventCircuits } from "@/lib/taxonomy";
import type { RelationshipPickerOption } from "@/lib/relationships";

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function EventForm({ directoryEntries = [] }: { directoryEntries?: RelationshipPickerOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createEvent, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form ref={formRef} action={formAction} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>Event title<input name="title" required maxLength={180} className={inputClassName} /></label>
        <label className={labelClassName}>Circuit<select name="circuit" required defaultValue="" className={inputClassName}><option value="" disabled>Choose a circuit</option>{eventCircuits.map((circuit) => <option key={circuit.slug} value={circuit.label}>{circuit.label}</option>)}</select></label>
        <label className={labelClassName}>Venue<input name="venue" required maxLength={180} className={inputClassName} /></label>
        <label className={labelClassName}>Organizer directory listing <span className="font-normal text-[#686a61]">(optional)</span><select name="organizerDirectoryEntryId" defaultValue="" className={inputClassName}><option value="">Keep organizer in the event copy</option>{directoryEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.category ? ` · ${entry.category}` : ""}</option>)}</select></label>
        <label className={labelClassName}>City<input name="city" required maxLength={100} className={inputClassName} /></label>
        <label className={labelClassName}>State<input name="state" required maxLength={80} className={inputClassName} /></label>
        <label className={labelClassName}>Website <span className="font-normal text-[#686a61]">(optional)</span><input name="website" type="url" maxLength={2000} placeholder="https://" className={inputClassName} /></label>
        <label className={labelClassName}>Start date<input name="startDate" type="date" required className={inputClassName} /></label>
        <label className={labelClassName}>End date<input name="endDate" type="date" required className={inputClassName} /></label>
      </div>
      <label className={`mt-5 block ${labelClassName}`}>Description<textarea name="description" required maxLength={10000} rows={7} className={inputClassName} /></label>
      <label className={`mt-5 block ${labelClassName}`}>Contact details <span className="font-normal text-[#686a61]">(optional)</span><input name="contactDetails" maxLength={500} placeholder="Email, phone, or office contact" className={inputClassName} /></label>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5">
        <button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">Save draft</button>
        <button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : "Send for review"}</button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}

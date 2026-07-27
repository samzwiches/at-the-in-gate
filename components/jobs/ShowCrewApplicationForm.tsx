"use client";

import { useActionState } from "react";
import { applyForShowCrewJob } from "@/app/jobs/show-crew-actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function ShowCrewApplicationForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(applyForShowCrewJob, initialFormActionState);

  return (
    <form action={formAction} className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      <input type="hidden" name="jobId" value={jobId} />
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Offer to help</p>
      <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Put your name on the barn board.</h2>
      <p className="mt-3 text-sm leading-7 text-[#56584f]">Your contact details stay private. The poster can see them while reviewing applicants, and their contact is released to you only if you are selected.</p>
      <label className={`mt-6 block ${labelClassName}`}>
        Experience and availability
        <textarea
          name="message"
          required
          maxLength={3000}
          rows={6}
          placeholder="Tell them what you have done, which days and time blocks you can cover, and anything important about your horse-show experience."
          className={inputClassName}
        />
      </label>
      <label className={`mt-5 block ${labelClassName}`}>
        Private contact details
        <input
          name="contactDetails"
          required
          maxLength={500}
          placeholder="Phone, email, or both"
          className={inputClassName}
        />
      </label>
      <button type="submit" disabled={pending} className="mt-6 border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">
        {pending ? "Sending…" : "Send Show Crew application"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

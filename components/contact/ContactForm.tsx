"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitContactNote } from "@/app/contact/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [state, formAction, pending] = useActionState(submitContactNote, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} onFocusCapture={() => setStartedAt((current) => current || Date.now())} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      <input type="hidden" name="startedAt" value={startedAt || ""} />
      <div className="hidden" aria-hidden="true"><label>Organization<input name="organization" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-5 sm:grid-cols-2"><label className={labelClassName}>Name<input name="name" required maxLength={120} className={inputClassName} /></label><label className={labelClassName}>Email<input name="email" required type="email" maxLength={320} className={inputClassName} /></label></div>
      <label className={`mt-5 block ${labelClassName}`}>Subject<input name="subject" required maxLength={180} className={inputClassName} /></label>
      <label className={`mt-5 block ${labelClassName}`}>Your note<textarea name="message" required maxLength={5000} rows={8} className={inputClassName} /></label>
      <button type="submit" disabled={pending} className="mt-6 border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Sending…" : "Send note"}</button>
      <FormFeedback state={state} />
    </form>
  );
}

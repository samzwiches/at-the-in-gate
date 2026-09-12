"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEventUpdate, setEventStatus } from "@/app/events/show-hub-actions";
import type { FormActionState } from "@/lib/form-state";
import type { EventAttendanceStatus } from "@/lib/supabase/show-hub";

const initialState: FormActionState = { status: "idle", message: "" };

function Feedback({ state }: { state: FormActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`mt-3 text-xs font-semibold ${state.status === "error" ? "text-[#7b2430]" : "text-[#2d4737]"}`}
    >
      {state.message}
    </p>
  );
}

export function ShowStatusActions({
  eventId,
  eventSlug,
  status,
}: {
  eventId: string;
  eventSlug: string;
  status: EventAttendanceStatus | null;
}) {
  const [state, action, pending] = useActionState(setEventStatus, initialState);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="eventSlug" value={eventSlug} />
          <input type="hidden" name="status" value={status === "following" ? "clear" : "following"} />
          <button
            type="submit"
            disabled={pending}
            aria-pressed={status === "following"}
            className={`border px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 ${status === "following" ? "border-[#2d4737] bg-[#2d4737] text-[#f9f5ed]" : "border-[#2d4737] text-[#2d4737] hover:bg-[#2d4737] hover:text-[#f9f5ed]"}`}
          >
            {status === "following" ? "Following" : "Follow show"}
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="eventSlug" value={eventSlug} />
          <input type="hidden" name="status" value={status === "going" ? "clear" : "going"} />
          <button
            type="submit"
            disabled={pending}
            aria-pressed={status === "going"}
            className={`border px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 ${status === "going" ? "border-[#7b2430] bg-[#7b2430] text-[#f9f5ed]" : "border-[#7b2430] text-[#7b2430] hover:bg-[#7b2430] hover:text-[#f9f5ed]"}`}
          >
            {status === "going" ? "I'm going ✓" : "I'm going"}
          </button>
        </form>
      </div>
      <Feedback state={state} />
    </div>
  );
}

export function InGateComposer({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createEventUpdate, initialState);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="border border-[#242721]/20 bg-[#f9f5ed] p-4 sm:p-5">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="eventSlug" value={eventSlug} />
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#56584f]">
          Update type
          <select name="updateType" defaultValue="general" className="mt-2 w-full border border-[#242721]/25 bg-[#fffdf8] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#242721]">
            <option value="general">General</option>
            <option value="ring">Ring update</option>
            <option value="horse">Horse to try</option>
            <option value="shipping">Shipping</option>
            <option value="help">Help needed</option>
            <option value="vendor">Vendor / service</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#56584f]">
          Pass it down the aisle
          <textarea
            name="body"
            required
            maxLength={600}
            rows={3}
            placeholder="Ring 2 is about 20 minutes behind…"
            className="mt-2 w-full resize-y border border-[#242721]/25 bg-[#fffdf8] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#242721] placeholder:text-[#8a8b84]"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-[#686a61]">Keep updates timely, specific, and useful to people at this show.</p>
        <button type="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:opacity-60">
          {pending ? "Posting…" : "Post update"}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

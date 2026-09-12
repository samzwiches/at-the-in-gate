"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createShippingRoute, updateShippingRoute } from "@/app/shippers/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";
import type { RelationshipPickerOption } from "@/lib/relationships";

type RouteValues = {
  id: string;
  directory_entry_id: string;
  title: string;
  origin: string;
  destination: string;
  availability_note: string | null;
  description: string;
  image_path: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  total_capacity?: number;
  booked_spots?: number;
  route_status?: string;
  is_return_trip?: boolean;
  stops?: Array<{ location?: string }> | null;
};

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function ShippingRouteForm({ route, shipperEntries }: { route?: RouteValues; shipperEntries: RelationshipPickerOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = route ? updateShippingRoute : createShippingRoute;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);
  useEffect(() => { if (state.status === "success") { if (!route) formRef.current?.reset(); router.refresh(); } }, [router, route, state.status]);
  const stopsValue = route?.stops?.map((stop) => stop.location).filter(Boolean).join("\n") ?? "";

  return (
    <form ref={formRef} action={formAction} className="mt-8 space-y-6">
      {route ? <input type="hidden" name="routeId" value={route.id} /> : null}

      <section className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b2430]">Route basics</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Shipper directory listing<select name="directoryEntryId" required defaultValue={route?.directory_entry_id ?? ""} className={inputClassName}><option value="" disabled>Choose your published shipper listing</option>{shipperEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <label className={labelClassName}>Route title<input name="title" required maxLength={180} defaultValue={route?.title} placeholder="Kentucky to Wellington" className={inputClassName} /></label>
          <label className={labelClassName}>Origin<input name="origin" required maxLength={180} defaultValue={route?.origin} placeholder="Lexington, Kentucky" className={inputClassName} /></label>
          <label className={labelClassName}>Destination<input name="destination" required maxLength={180} defaultValue={route?.destination} placeholder="Wellington, Florida" className={inputClassName} /></label>
          <label className={labelClassName}>Departure date<input type="date" name="departureDate" defaultValue={route?.departure_date ?? ""} className={inputClassName} /></label>
          <label className={labelClassName}>Return date <span className="font-normal text-[#686a61]">(optional)</span><input type="date" name="returnDate" defaultValue={route?.return_date ?? ""} className={inputClassName} /></label>
        </div>
        <label className={`mt-5 block ${labelClassName}`}>Route description<textarea name="description" required maxLength={10000} rows={6} defaultValue={route?.description} placeholder="Describe timing, pickup flexibility, trailer setup, and anything riders should know." className={inputClassName} /></label>
      </section>

      <section className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b2430]">Trailer capacity</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <label className={labelClassName}>Total spaces<input type="number" min="1" max="30" name="totalCapacity" required defaultValue={route?.total_capacity ?? 1} className={inputClassName} /></label>
          <label className={labelClassName}>Already booked<input type="number" min="0" max="30" name="bookedSpots" required defaultValue={route?.booked_spots ?? 0} className={inputClassName} /></label>
          <label className={labelClassName}>Route status<select name="routeStatus" defaultValue={route?.route_status ?? "planning"} className={inputClassName}><option value="planning">Planning</option><option value="open">Open for bookings</option><option value="nearly-full">Nearly full</option><option value="full">Full</option><option value="departed">Departed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm font-semibold text-[#2d4737]"><input type="checkbox" name="isReturnTrip" defaultChecked={route?.is_return_trip ?? false} className="mt-1 h-4 w-4" /><span>This is a return leg or I have space coming home.<span className="mt-1 block font-normal leading-6 text-[#686a61]">Perfect for filling the miles that usually come back empty.</span></span></label>
      </section>

      <section className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b2430]">Stops and pickup corridor</p>
        <label className={`mt-5 block ${labelClassName}`}>Possible stops <span className="font-normal text-[#686a61]">one per line</span><textarea name="stops" rows={5} defaultValue={stopsValue} placeholder={'Knoxville, TN\nAtlanta, GA\nOcala, FL'} className={inputClassName} /></label>
        <p className="mt-3 text-sm leading-6 text-[#56584f]">These will become map points in the next pass. For now they give riders a clean idea of the corridor you can serve.</p>
      </section>

      <section className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Availability note <span className="font-normal text-[#686a61]">(optional)</span><input name="availabilityNote" maxLength={500} defaultValue={route?.availability_note ?? ""} placeholder="Two straight-load spots left; box stall by arrangement" className={inputClassName} /></label>
          <label className={labelClassName}>Image path <span className="font-normal text-[#686a61]">(optional)</span><input name="imagePath" maxLength={500} defaultValue={route?.image_path ?? ""} placeholder="/images/shipping/your-rig.jpg" className={inputClassName} /></label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5">
          <button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] disabled:cursor-not-allowed disabled:opacity-70">Save draft</button>
          <button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : route ? "Send changes for review" : "Publish route for review"}</button>
        </div>
        <FormFeedback state={state} />
      </section>
    </form>
  );
}

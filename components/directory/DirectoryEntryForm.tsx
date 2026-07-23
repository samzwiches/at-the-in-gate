"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createDirectoryEntry, updateDirectoryEntry } from "@/app/directory/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";
import { directoryCategories } from "@/lib/taxonomy";

type DirectoryEntryValues = {
  id: string;
  name: string;
  entry_type: string;
  category: string;
  description: string;
  city: string;
  state: string;
  service_area: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  image_path: string | null;
};

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function DirectoryEntryForm({ entry }: { entry?: DirectoryEntryValues }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = entry ? updateDirectoryEntry : createDirectoryEntry;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      if (!entry) formRef.current?.reset();
      router.refresh();
    }
  }, [entry, router, state.status]);

  return (
    <form ref={formRef} action={formAction} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>Listing name<input name="name" required maxLength={180} defaultValue={entry?.name} className={inputClassName} /></label>
        <label className={labelClassName}>Directory category<select name="category" required defaultValue={entry?.category ?? ""} className={inputClassName}><option value="" disabled>Choose one</option>{directoryCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}</select></label>
        <label className={labelClassName}>Listing type<select name="entryType" required defaultValue={entry?.entry_type ?? "service"} className={inputClassName}><option value="individual">Individual practice</option><option value="business">Business or barn</option><option value="service">Service provider</option></select></label>
        <label className={labelClassName}>Service area <span className="font-normal text-[#686a61]">(optional)</span><input name="serviceArea" maxLength={240} defaultValue={entry?.service_area ?? ""} placeholder="Northeast circuit, regional, nationwide" className={inputClassName} /></label>
        <label className={labelClassName}>City<input name="city" required maxLength={100} defaultValue={entry?.city} className={inputClassName} /></label>
        <label className={labelClassName}>State<input name="state" required maxLength={80} defaultValue={entry?.state} className={inputClassName} /></label>
      </div>
      <label className={`mt-5 block ${labelClassName}`}>Description<textarea name="description" required maxLength={10000} rows={8} defaultValue={entry?.description} className={inputClassName} /></label>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>Website <span className="font-normal text-[#686a61]">(optional)</span><input name="website" type="url" maxLength={2000} defaultValue={entry?.website ?? ""} placeholder="https://" className={inputClassName} /></label>
        <label className={labelClassName}>Email <span className="font-normal text-[#686a61]">(optional)</span><input name="email" type="email" maxLength={320} defaultValue={entry?.email ?? ""} className={inputClassName} /></label>
        <label className={labelClassName}>Phone <span className="font-normal text-[#686a61]">(optional)</span><input name="phone" type="tel" maxLength={50} defaultValue={entry?.phone ?? ""} className={inputClassName} /></label>
        <label className={labelClassName}>Image path <span className="font-normal text-[#686a61]">(optional)</span><input name="imagePath" maxLength={500} defaultValue={entry?.image_path ?? ""} placeholder="/images/directory/your-image.jpg" className={inputClassName} /></label>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5"><button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">Save draft</button><button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : entry ? "Send changes for review" : "Send for review"}</button></div>
      <FormFeedback state={state} />
    </form>
  );
}

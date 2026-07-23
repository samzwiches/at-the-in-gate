"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createReview, updateReview } from "@/app/reviews/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

type ReviewValues = { id: string; rating: number; title: string | null; body: string; };
const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function ReviewForm({ targetType, targetId, targetName, review }: { targetType?: string; targetId?: string; targetName: string; review?: ReviewValues }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = review ? updateReview : createReview;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);
  useEffect(() => { if (state.status === "success") { if (!review) formRef.current?.reset(); router.refresh(); } }, [review, router, state.status]);
  return <form ref={formRef} action={formAction} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">{review ? <input type="hidden" name="reviewId" value={review.id} /> : <><input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} /></>}<p className="border-l-2 border-[#b08d57] pl-3 text-sm leading-6 text-[#56584f]">You are writing about <span className="font-bold text-[#2d4737]">{targetName}</span>. Keep it specific, fair, and rooted in your own experience. Submissions are reviewed before publication.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className={labelClassName}>Rating<select name="rating" required defaultValue={review?.rating ?? ""} className={inputClassName}><option value="" disabled>Choose one</option><option value="5">5 — Excellent</option><option value="4">4 — Strong</option><option value="3">3 — Solid</option><option value="2">2 — Needs improvement</option><option value="1">1 — Poor</option></select></label><label className={labelClassName}>Short title <span className="font-normal text-[#686a61]">(optional)</span><input name="title" maxLength={180} defaultValue={review?.title ?? ""} className={inputClassName} /></label></div><label className={`mt-5 block ${labelClassName}`}>Your review<textarea name="body" required maxLength={5000} rows={8} defaultValue={review?.body ?? ""} className={inputClassName} /></label><div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5"><button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] disabled:cursor-not-allowed disabled:opacity-70">Save draft</button><button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : review ? "Send changes for review" : "Send for review"}</button></div><FormFeedback state={state} /></form>;
}

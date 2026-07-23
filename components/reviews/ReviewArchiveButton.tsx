"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { archiveReview } from "@/app/reviews/actions";
import { initialFormActionState } from "@/lib/form-state";

export default function ReviewArchiveButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(archiveReview, initialFormActionState);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state.status]);
  return <form action={formAction}><input type="hidden" name="reviewId" value={reviewId} /><button type="submit" disabled={pending} className="text-sm font-bold text-[#7b2430] underline underline-offset-4 disabled:opacity-70">{pending ? "Archiving…" : "Archive"}</button></form>;
}

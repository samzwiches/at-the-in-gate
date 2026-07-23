"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markListingSold } from "@/app/marketplace/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

export default function ListingSoldButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(markListingSold, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  return <form action={action}><input type="hidden" name="listingId" value={listingId} /><button type="submit" disabled={pending} className="text-xs font-bold text-[#2d4737] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Updating…" : "Mark sold"}</button><FormFeedback state={state} /></form>;
}

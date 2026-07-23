"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { archiveListing } from "@/app/marketplace/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

export default function ListingArchiveButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(archiveListing, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return <form action={action}><input type="hidden" name="listingId" value={listingId} /><button type="submit" disabled={pending} className="text-xs font-bold text-[#7b2430] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Archiving…" : "Archive"}</button><FormFeedback state={state} /></form>;
}

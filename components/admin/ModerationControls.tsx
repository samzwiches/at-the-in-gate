"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { moderateDirectoryEntry, moderateReview, moderateServiceOffering, moderateShippingRoute, moderateShopItem } from "@/app/admin/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

type ModerationControlsProps = {
  recordId: string;
  status: string;
  target: "directory" | "shop" | "service" | "shipping" | "review";
};

export default function ModerationControls({ recordId, status, target }: ModerationControlsProps) {
  const router = useRouter();
  const action = target === "directory" ? moderateDirectoryEntry : target === "shop" ? moderateShopItem : target === "service" ? moderateServiceOffering : target === "shipping" ? moderateShippingRoute : moderateReview;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state.status]);

  return <form action={formAction} className="flex flex-wrap items-center gap-2"><input type="hidden" name="recordId" value={recordId} />{status === "pending" ? <><button type="submit" name="intent" value="approve" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-3 py-2 text-xs font-bold text-[#f9f4eb] disabled:cursor-not-allowed disabled:opacity-70">Approve</button><button type="submit" name="intent" value="reject" disabled={pending} className="border border-[#7b2430] px-3 py-2 text-xs font-bold text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">Reject</button></> : null}{status === "rejected" || status === "archived" ? <button type="submit" name="intent" value="restore" disabled={pending} className="border border-[#2d4737] px-3 py-2 text-xs font-bold text-[#2d4737] disabled:cursor-not-allowed disabled:opacity-70">Restore to review</button> : null}{status !== "archived" ? <button type="submit" name="intent" value="archive" disabled={pending} className="text-xs font-bold text-[#7b2430] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-70">Archive</button> : null}<FormFeedback state={state} /></form>;
}

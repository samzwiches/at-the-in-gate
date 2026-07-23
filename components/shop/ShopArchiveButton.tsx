"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { archiveShopItem } from "@/app/shop/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";

export default function ShopArchiveButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(archiveShopItem, initialFormActionState);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state.status]);
  return <form action={action}><input type="hidden" name="itemId" value={itemId} /><button type="submit" disabled={pending} className="text-xs font-bold text-[#7b2430] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Archiving…" : "Archive"}</button><FormFeedback state={state} /></form>;
}

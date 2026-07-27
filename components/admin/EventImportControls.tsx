"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { publishEventImport, updateEventImportStatus } from "@/app/admin/event-import-actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";
import type { EventImportStatus } from "@/lib/supabase/event-imports";

type EventImportControlsProps = {
  recordId: string;
  status: EventImportStatus;
};

export default function EventImportControls({ recordId, status }: EventImportControlsProps) {
  const router = useRouter();
  const [publishState, publishAction, publishPending] = useActionState(
    publishEventImport,
    initialFormActionState
  );
  const [statusState, statusAction, statusPending] = useActionState(
    updateEventImportStatus,
    initialFormActionState
  );

  useEffect(() => {
    if (publishState.status === "success" || statusState.status === "success") {
      router.refresh();
    }
  }, [publishState.status, router, statusState.status]);

  if (status === "matched" || status === "approved") {
    return (
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2d4737]">
        On calendar
      </p>
    );
  }

  return (
    <div className="flex max-w-sm flex-col items-start gap-2">
      {status === "new" || status === "reviewing" ? (
        <div className="flex flex-wrap items-center gap-2">
          <form action={publishAction}>
            <input type="hidden" name="recordId" value={recordId} />
            <button
              type="submit"
              disabled={publishPending || statusPending}
              className="border border-[#2d4737] bg-[#2d4737] px-3 py-2 text-xs font-bold text-[#f9f4eb] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Publish to calendar
            </button>
          </form>
          <form action={statusAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="recordId" value={recordId} />
            <button
              type="submit"
              name="intent"
              value="reject"
              disabled={publishPending || statusPending}
              className="border border-[#7b2430] px-3 py-2 text-xs font-bold text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Reject
            </button>
            <button
              type="submit"
              name="intent"
              value="ignore"
              disabled={publishPending || statusPending}
              className="text-xs font-bold text-[#686a61] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Ignore
            </button>
          </form>
        </div>
      ) : (
        <form action={statusAction}>
          <input type="hidden" name="recordId" value={recordId} />
          <button
            type="submit"
            name="intent"
            value="restore"
            disabled={statusPending}
            className="border border-[#2d4737] px-3 py-2 text-xs font-bold text-[#2d4737] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Restore to review
          </button>
        </form>
      )}
      <FormFeedback state={publishState.status === "idle" ? statusState : publishState} />
    </div>
  );
}

import type { FormActionState } from "@/lib/form-state";

export default function FormFeedback({ state }: { state: FormActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p role={state.status === "error" ? "alert" : "status"} className={`mt-4 border px-4 py-3 text-sm leading-6 ${state.status === "error" ? "border-[#7b2430]/40 bg-[#f1dedd] text-[#7b2430]" : "border-[#2d4737]/30 bg-[#e5eee7] text-[#2d4737]"}`}>
      {state.message}
    </p>
  );
}

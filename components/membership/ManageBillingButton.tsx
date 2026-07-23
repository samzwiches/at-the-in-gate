"use client";

import { useState } from "react";

export default function ManageBillingButton({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function openBillingPortal() {
    setStatus("loading");

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string };

      if (!response.ok || !payload.url) {
        setStatus("error");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void openBillingPortal()}
        disabled={status === "loading"}
        className={`inline-flex items-center justify-center gap-3 border border-[#242721]/35 px-5 py-3 text-sm font-bold text-[#2c3029] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      >
        {status === "loading" ? "Opening billing…" : "Manage billing"}
      </button>
      {status === "error" ? <p role="alert" className="mt-3 text-sm leading-6 text-[#7b2430]">Billing management is unavailable right now. Please try again shortly.</p> : null}
    </div>
  );
}

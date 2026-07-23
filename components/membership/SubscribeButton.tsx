"use client";

import { useState } from "react";

type SubscribeButtonProps = {
  authenticated: boolean;
};

export default function SubscribeButton({ authenticated }: SubscribeButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function beginCheckout() {
    if (!authenticated) {
      window.location.assign("/sign-in?next=%2Fmembership");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        window.location.assign("/sign-in?next=%2Fmembership");
        return;
      }

      if (!response.ok || !payload.url) {
        setStatus("error");
        setMessage(payload.error ?? "Membership Checkout could not start. Please try again.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setStatus("error");
      setMessage("Membership Checkout could not start. Please try again.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void beginCheckout()}
        disabled={status === "loading"}
        className="inline-flex items-center justify-center gap-3 border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Opening Checkout…" : authenticated ? "Subscribe to membership" : "Sign in to subscribe"}
      </button>
      {status === "loading" ? <p role="status" className="mt-3 text-sm text-[#56584f]">Opening the secure payment page.</p> : null}
      {status === "error" ? <p role="alert" className="mt-3 border border-[#7b2430]/40 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#7b2430]">{message}</p> : null}
    </div>
  );
}

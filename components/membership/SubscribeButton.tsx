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

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as { url?: string; error?: string })
        : { error: "Membership Checkout returned an unexpected response." };

      if (response.status === 401) {
        window.location.assign("/sign-in?next=%2Fmembership");
        return;
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Membership Checkout could not start. Please try again.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Checkout took too long to respond. Please try again."
          : error instanceof Error
            ? error.message
            : "Membership Checkout could not start. Please try again."
      );
    } finally {
      window.clearTimeout(timeoutId);
      setStatus((current) => (current === "loading" ? "idle" : current));
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

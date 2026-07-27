"use client";

import { useState } from "react";

type SubscribeButtonProps = {
  authenticated: boolean;
};

type MembershipBillingInterval = "monthly" | "annual";

export default function SubscribeButton({ authenticated }: SubscribeButtonProps) {
  const [loadingInterval, setLoadingInterval] = useState<MembershipBillingInterval | null>(null);
  const [message, setMessage] = useState("");

  async function beginCheckout(interval: MembershipBillingInterval) {
    if (!authenticated) {
      window.location.assign("/sign-in?next=%2Fmembership");
      return;
    }

    setLoadingInterval(interval);
    setMessage("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interval }),
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
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Checkout took too long to respond. Please try again."
          : error instanceof Error
            ? error.message
            : "Membership Checkout could not start. Please try again."
      );
    } finally {
      window.clearTimeout(timeoutId);
      setLoadingInterval(null);
    }
  }

  const checkoutIsOpening = loadingInterval !== null;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void beginCheckout("monthly")}
          disabled={checkoutIsOpening}
          className="inline-flex min-h-14 items-center justify-center border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingInterval === "monthly" ? "Opening monthly Checkout…" : "Pay monthly"}
        </button>
        <button
          type="button"
          onClick={() => void beginCheckout("annual")}
          disabled={checkoutIsOpening}
          className="inline-flex min-h-14 items-center justify-center border border-[#d8bd85] bg-[#d8bd85] px-5 py-3 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#f9f4eb] hover:bg-[#f9f4eb] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingInterval === "annual" ? "Opening annual Checkout…" : "Pay annually"}
        </button>
      </div>
      {checkoutIsOpening ? <p role="status" className="mt-3 text-sm text-[#e2ddcf]">Opening the secure payment page.</p> : null}
      {message ? <p role="alert" className="mt-3 border border-[#d8bd85]/60 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#7b2430]">{message}</p> : null}
    </div>
  );
}

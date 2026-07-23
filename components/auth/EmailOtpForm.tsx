"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EmailOtpFormProps = {
  nextPath: string;
};

type FormStatus = "idle" | "sending" | "sent" | "verifying" | "success" | "error";

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-base text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737] disabled:cursor-not-allowed disabled:opacity-70";

export default function EmailOtpForm({ nextPath }: EmailOtpFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace(nextPath);
      router.refresh();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [nextPath, router, status]);

  async function requestCode() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Add your email address first.");
      return;
    }

    setStatus("sending");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setStatus("error");
      setMessage("We could not send a code just now. Please check the address and try again.");
      return;
    }

    setEmail(normalizedEmail);
    setCode("");
    setStep("code");
    setStatus("sent");
    setMessage("A six-digit code is on its way. Check the inbox you entered.");
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setStatus("error");
      setMessage("Enter the full six-digit code from your email.");
      return;
    }

    setStatus("verifying");
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data.session) {
      setStatus("error");
      setMessage("That code is expired or does not match. Request a fresh one and try again.");
      return;
    }

    setStatus("success");
    setMessage("You are in. Opening your account now.");
  }

  const isBusy = status === "sending" || status === "verifying" || status === "success";
  const isError = status === "error";

  return (
    <div className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
      {step === "email" ? (
        <form onSubmit={handleEmailSubmit}>
          <label htmlFor="sign-in-email" className="text-sm font-semibold text-[#2d4737]">Email address</label>
          <input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClassName}
            disabled={isBusy}
            required
          />
          <p className="mt-2 text-xs leading-5 text-[#686a61]">New here is fine. The same code gets you started and gets you back in.</p>
          <button type="submit" disabled={isBusy} className="mt-6 w-full border border-[#2d4737] bg-[#2d4737] px-5 py-3.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">
            {status === "sending" ? "Sending your code…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCodeSubmit}>
          <p className="text-sm font-semibold text-[#2d4737]">Code sent to <span className="font-normal text-[#56584f]">{email}</span></p>
          <label htmlFor="sign-in-code" className="mt-5 block text-sm font-semibold text-[#2d4737]">Six-digit code</label>
          <input
            id="sign-in-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className={`${inputClassName} tracking-[0.28em]`}
            disabled={isBusy}
            required
          />
          <button type="submit" disabled={isBusy} className="mt-6 w-full border border-[#2d4737] bg-[#2d4737] px-5 py-3.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">
            {status === "verifying" ? "Checking the code…" : "Continue to my account"}
          </button>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <button type="button" onClick={() => void requestCode()} disabled={isBusy} className="border-b border-[#2d4737] pb-0.5 font-semibold text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">
              Send a new code
            </button>
            <button type="button" onClick={() => { setStep("email"); setStatus("idle"); setMessage(""); }} disabled={isBusy} className="border-b border-[#56584f] pb-0.5 text-[#56584f] hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">
              Use another email
            </button>
          </div>
        </form>
      )}

      {message ? (
        <p role={isError ? "alert" : "status"} className={`mt-5 border px-4 py-3 text-sm leading-6 ${isError ? "border-[#7b2430]/40 bg-[#f1dedd] text-[#7b2430]" : "border-[#2d4737]/30 bg-[#e5eee7] text-[#2d4737]"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

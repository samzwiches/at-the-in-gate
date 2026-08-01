"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MemberSignInOptionsProps = {
  nextPath: string;
};

type Notice = { tone: "success" | "error"; message: string } | null;

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function MemberSignInOptions({ nextPath }: MemberSignInOptionsProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  function callbackUrl() {
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("next", nextPath);
    return url.toString();
  }

  async function continueWithProvider(provider: "google" | "facebook") {
    setLoading(provider);
    setNotice(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl(), skipBrowserRedirect: true },
    });

    if (error || !data.url) {
      setNotice({ tone: "error", message: error?.message ?? `${provider} did not return a sign-in URL.` });
      setLoading(null);
      return;
    }

    window.location.assign(data.url);
  }

  async function continueWithEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("email");
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true },
    });

    setNotice(error
      ? { tone: "error", message: error.message }
      : { tone: "success", message: "Check your email for the secure sign-in link." });
    setLoading(null);
  }

  async function sendPhoneCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("phone-send");
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
      options: { shouldCreateUser: true },
    });

    if (error) {
      setNotice({ tone: "error", message: error.message });
    } else {
      setPhoneCodeSent(true);
      setNotice({ tone: "success", message: "We sent a six-digit sign-in code by text." });
    }
    setLoading(null);
  }

  async function verifyPhoneCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("phone-verify");
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: phoneCode.trim(),
      type: "sms",
    });

    if (error) {
      setNotice({ tone: "error", message: error.message });
      setLoading(null);
      return;
    }

    window.location.assign(nextPath);
  }

  return (
    <div className="mt-8 grid gap-5">
      <div className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Fastest way in</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void continueWithProvider("google")} disabled={loading !== null} className="flex items-center justify-center gap-3 border border-[#242721]/35 px-5 py-3.5 text-sm font-bold text-[#242721] transition-colors hover:border-[#2d4737] hover:bg-[#e7e1d5] disabled:opacity-60"><span aria-hidden="true" className="font-serif text-lg">G</span>{loading === "google" ? "Opening Google…" : "Continue with Google"}</button>
          <button type="button" onClick={() => void continueWithProvider("facebook")} disabled={loading !== null} className="flex items-center justify-center gap-3 border border-[#242721]/35 px-5 py-3.5 text-sm font-bold text-[#242721] transition-colors hover:border-[#2d4737] hover:bg-[#e7e1d5] disabled:opacity-60"><span aria-hidden="true" className="font-serif text-lg">f</span>{loading === "facebook" ? "Opening Facebook…" : "Continue with Facebook"}</button>
        </div>
      </div>

      <form onSubmit={continueWithEmail} className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Email</p>
        <label className={`mt-4 block ${labelClassName}`}>Email address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={inputClassName} /></label>
        <button disabled={loading !== null} className="mt-4 w-full border border-[#2d4737] bg-[#2d4737] px-5 py-3.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:opacity-60">{loading === "email" ? "Sending link…" : "Email me a sign-in link"}</button>
        <p className="mt-3 text-xs leading-5 text-[#686a61]">No password to remember. The first link creates the account and future links sign the member back in.</p>
      </form>

      <form onSubmit={phoneCodeSent ? verifyPhoneCode : sendPhoneCode} className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Phone</p>
        <label className={`mt-4 block ${labelClassName}`}>Mobile number<input type="tel" required autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 513 555 0123" disabled={phoneCodeSent} className={inputClassName} /></label>
        {phoneCodeSent ? <label className={`mt-4 block ${labelClassName}`}>Six-digit code<input inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, ""))} placeholder="123456" className={inputClassName} /></label> : null}
        <button disabled={loading !== null} className="mt-4 w-full border border-[#2d4737] bg-[#2d4737] px-5 py-3.5 text-sm font-bold text-[#f9f5ed] transition-colors hover:bg-[#7b2430] disabled:opacity-60">{loading?.startsWith("phone") ? "Working…" : phoneCodeSent ? "Verify code" : "Text me a sign-in code"}</button>
        {phoneCodeSent ? <button type="button" onClick={() => { setPhoneCodeSent(false); setPhoneCode(""); setNotice(null); }} className="mt-3 w-full text-xs font-bold text-[#2d4737] underline underline-offset-4">Use a different number</button> : null}
        <p className="mt-3 text-xs leading-5 text-[#686a61]">Use the full number with country code. Standard text-message rates may apply.</p>
      </form>

      {notice ? <p role={notice.tone === "error" ? "alert" : "status"} className={`border px-4 py-3 text-sm leading-6 ${notice.tone === "error" ? "border-[#7b2430]/40 bg-[#f1dedd] text-[#7b2430]" : "border-[#2d4737]/30 bg-[#e5eee7] text-[#2d4737]"}`}>{notice.message}</p> : null}
    </div>
  );
}

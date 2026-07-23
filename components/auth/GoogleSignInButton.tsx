"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  nextPath: string;
};

export default function GoogleSignInButton({ nextPath }: GoogleSignInButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function continueWithGoogle() {
    setStatus("loading");

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      setStatus("error");
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
      <button
        type="button"
        onClick={() => void continueWithGoogle()}
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-3 border border-[#242721]/35 bg-[#f9f5ed] px-5 py-3.5 text-sm font-bold text-[#242721] transition-colors hover:border-[#2d4737] hover:bg-[#e7e1d5] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span aria-hidden="true" className="flex size-5 items-center justify-center border border-[#242721]/25 bg-white text-xs font-bold text-[#7b2430]">G</span>
        {status === "loading" ? "Opening Google…" : "Continue with Google"}
      </button>
      <p className="mt-4 text-xs leading-5 text-[#686a61]">Google handles the sign-in step. We only receive the member session needed to open your account.</p>
      {status === "loading" ? <p role="status" className="mt-4 border border-[#2d4737]/30 bg-[#e5eee7] px-4 py-3 text-sm leading-6 text-[#2d4737]">Taking you to Google now.</p> : null}
      {status === "error" ? <p role="alert" className="mt-4 border border-[#7b2430]/40 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#7b2430]">Google sign-in could not start. Please try again.</p> : null}
    </div>
  );
}

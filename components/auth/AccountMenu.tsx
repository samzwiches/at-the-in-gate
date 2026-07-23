"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AccountMenuProps = {
  authenticated: boolean;
  isAdmin?: boolean;
  mobile?: boolean;
};

export default function AccountMenu({ authenticated, isAdmin = false, mobile = false }: AccountMenuProps) {
  const router = useRouter();
  const [sessionAuthenticated, setSessionAuthenticated] = useState<boolean | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const isAuthenticated = sessionAuthenticated ?? authenticated;

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setSessionAuthenticated(Boolean(data.user));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionAuthenticated(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    setIsSigningOut(true);
    setSignOutError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      setSignOutError("We could not sign you out. Please try again.");
      return;
    }

    setSessionAuthenticated(false);
    router.replace("/");
    router.refresh();
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/sign-in"
        className={mobile
          ? "block px-3 py-2.5 text-sm font-medium text-[#383a33] hover:bg-[#e5ddd0]"
          : "text-sm font-medium text-[#383a33] transition-colors hover:text-[#7b2430]"}
      >
        Sign in
      </Link>
    );
  }

  if (mobile) {
    return (
      <div className="mt-1 border-t border-[#242721]/15 pt-1">
        <Link href="/account" className="block px-3 py-2.5 text-sm font-semibold text-[#2d4737] hover:bg-[#e5ddd0]">My account</Link>
        <Link href="/dashboard" className="block px-3 py-2.5 text-sm font-medium text-[#383a33] hover:bg-[#e5ddd0]">
          Dashboard
        </Link>
        {isAdmin ? <Link href="/admin" className="block px-3 py-2.5 text-sm font-medium text-[#7b2430] hover:bg-[#e5ddd0]">Admin dashboard</Link> : null}
        <button type="button" onClick={() => void signOut()} disabled={isSigningOut} className="block w-full px-3 py-2.5 text-left text-sm font-medium text-[#383a33] hover:bg-[#e5ddd0] disabled:cursor-not-allowed disabled:opacity-70">
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
        {signOutError ? <p role="alert" className="px-3 pb-2 text-xs leading-5 text-[#7b2430]">{signOutError}</p> : null}
      </div>
    );
  }

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none text-sm font-medium text-[#383a33] transition-colors hover:text-[#7b2430] marker:content-none">
        My account
      </summary>
      <div className="absolute right-0 z-20 mt-3 w-40 border border-[#242721]/20 bg-[#f9f5ed] p-2 shadow-[4px_4px_0_0_rgba(45,71,55,0.14)]">
        <Link href="/account" className="block px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#2d4737] hover:bg-[#e5ddd0]">My account</Link>
        <Link href="/dashboard" className="block px-3 py-2.5 text-sm font-medium text-[#383a33] hover:bg-[#e5ddd0]">
          Dashboard
        </Link>
        {isAdmin ? <Link href="/admin" className="block px-3 py-2.5 text-sm font-medium text-[#7b2430] hover:bg-[#e5ddd0]">Admin dashboard</Link> : null}
        <button type="button" onClick={() => void signOut()} disabled={isSigningOut} className="block w-full px-3 py-2.5 text-left text-sm font-medium text-[#383a33] hover:bg-[#e5ddd0] disabled:cursor-not-allowed disabled:opacity-70">
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
        {signOutError ? <p role="alert" className="px-3 pb-2 text-xs leading-5 text-[#7b2430]">{signOutError}</p> : null}
      </div>
    </details>
  );
}

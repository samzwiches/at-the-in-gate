import Link from "next/link";
import AccountMenu from "@/components/auth/AccountMenu";
import MainNavigation from "@/components/layout/MainNavigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { getMembershipForProfile } from "@/lib/membership/membership";
import { siteSectionAppearanceStyle } from "@/lib/site-section-appearance";
import { getSiteSectionAppearance } from "@/lib/supabase/site-section-appearance";

export default async function Header() {
  const [user, appearance] = await Promise.all([
    getAuthenticatedUser(),
    getSiteSectionAppearance("header"),
  ]);
  const membership = user ? await getMembershipForProfile(user.id).catch(() => null) : null;
  const isAdmin = membership?.isAdmin ?? false;

  return (
    <header className="border-b border-[#242721]/20 bg-[#f4efe5]" style={siteSectionAppearanceStyle(appearance)}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center gap-3" aria-label="At The In Gate home">
          <span className="flex size-9 items-center justify-center border border-[#b08d57] text-sm font-bold text-[color:var(--section-default-color,#2d4737)]">A</span>
          <span className="leading-none">
            <span className="section-appearance-heading-font block text-lg tracking-[-0.03em] text-[color:var(--section-default-color,#242721)]">At The In Gate</span>
            <span className="section-appearance-body-font mt-1 block text-[0.55rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-default-color,#5a645d)]">The show book</span>
          </span>
        </Link>
        <MainNavigation />
        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/marketplace" className="section-appearance-body-font text-sm font-medium text-[color:var(--section-navigation-color,#383a33)] transition-colors hover:text-[#7b2430]">Search</Link>
          <AccountMenu authenticated={Boolean(user)} isAdmin={isAdmin} />
          <Link href="/marketplace/new" className="border border-[#2d4737] bg-[#2d4737] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430]">Post a listing</Link>
        </div>
        <MobileNavigation authenticated={Boolean(user)} isAdmin={isAdmin} />
      </div>
    </header>
  );
}

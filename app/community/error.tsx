"use client";

import PageContainer from "@/components/layout/PageContainer";

export default function CommunityError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="bg-[#dce4e4] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-3xl border border-[#7b2430]/35 bg-[#f9f5ed] p-6 sm:p-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Community unavailable</p><h1 className="mt-3 font-serif text-4xl tracking-[-0.035em] text-[#242721]">The aisle is taking a minute.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#56584f]">We could not load this member conversation just now. Your access has not changed.</p><button type="button" onClick={reset} className="mt-6 border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430]">Try again</button></div></PageContainer></main>
  );
}

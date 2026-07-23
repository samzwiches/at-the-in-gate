import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";

export default function CommunityNotFound() {
  return (
    <main className="bg-[#dce4e4] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-3xl border border-[#242721]/20 bg-[#f9f5ed] p-6 sm:p-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Out of view</p><h1 className="mt-3 font-serif text-4xl tracking-[-0.035em] text-[#242721]">That conversation is not open to you.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#56584f]">The space may not exist, or the note may be private, hidden, removed, or deleted. Nothing else in the community has changed.</p><Link href="/community" className="mt-6 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Return to member spaces <span className="ml-2" aria-hidden="true">↗</span></Link></div></PageContainer></main>
  );
}

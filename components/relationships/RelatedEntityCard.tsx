import Link from "next/link";

export default function RelatedEntityCard({ eyebrow, title, detail, href }: { eyebrow: string; title: string; detail?: string; href: string }) {
  return <article className="border border-[#242721]/20 bg-[#f9f5ed] p-4"><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{eyebrow}</p><h3 className="mt-2 font-serif text-2xl text-[#242721]"><Link href={href} className="transition-colors hover:text-[#7b2430]">{title}</Link></h3>{detail ? <p className="mt-2 text-sm leading-6 text-[#56584f]">{detail}</p> : null}<Link href={href} className="mt-4 inline-flex border-b border-[#2d4737] pb-0.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Open record</Link></article>;
}

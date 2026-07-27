import { Award } from "lucide-react";

export default function FoundingMemberBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center border border-[#b08d57] bg-[#f8f0dc] font-bold uppercase text-[#6f2b35] ${
        compact
          ? "gap-1 px-1.5 py-0.5 text-[0.5625rem] tracking-[0.11em]"
          : "gap-1.5 px-2.5 py-1.5 text-[0.625rem] tracking-[0.14em]"
      }`}
      title="One of the first members who helped shape At The In Gate"
    >
      <Award aria-hidden="true" size={compact ? 11 : 13} strokeWidth={1.8} />
      Founding Member
    </span>
  );
}

import type { ReactNode } from "react";

export default function EmptyState({
  eyebrow = "Nothing here yet",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="border border-dashed border-[#2d4737]/40 bg-[#e6ece9] p-6 sm:p-8">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">{eyebrow}</p>
      <h3 className="mt-3 font-serif text-3xl tracking-[-0.025em] text-[#242721]">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#56584f]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

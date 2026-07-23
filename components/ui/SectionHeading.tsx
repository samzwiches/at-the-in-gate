import Button from "@/components/ui/Button";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  showRule = true,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  showRule?: boolean;
}) {
  return (
    <div className={`mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between ${showRule ? "border-t border-[#242721]/20 pt-4" : ""}`}>
      <div className="max-w-2xl">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">{eyebrow}</p>
        <h2 className="mt-3 font-serif text-3xl tracking-[-0.025em] text-[#22251f] sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-xl text-sm leading-6 text-[#56584f] sm:text-base">{description}</p> : null}
      </div>
      {action ? <Button href={action.href} variant="utility" className="group w-fit">{action.label}<span className="text-xl leading-none transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span></Button> : null}
    </div>
  );
}

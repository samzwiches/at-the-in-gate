import Link from "next/link";

type Breadcrumb = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#56584f]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden="true" className="text-[#7b2430]">/</span> : null}
          {item.href ? <Link href={item.href} className="border-b border-transparent font-semibold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

import Link from "next/link";

export type CategoryNavItem = {
  label: string;
  href: string;
};

export default function CategoryNav({
  ariaLabel,
  items,
  activeHref,
}: {
  ariaLabel: string;
  items: CategoryNavItem[];
  activeHref: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`whitespace-nowrap border px-3 py-2 text-xs font-bold transition-colors ${isActive ? "border-[#2d4737] bg-[#2d4737] text-[#f9f4eb]" : "border-[#242721]/20 bg-[#f8f4ec] text-[#50564e] hover:border-[#7b2430] hover:text-[#7b2430]"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

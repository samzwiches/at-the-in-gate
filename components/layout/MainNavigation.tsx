"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteNavigation } from "@/lib/placeholder-data";

export default function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
      {siteNavigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`section-appearance-body-font border-b pb-1 text-sm font-medium transition-colors ${active ? "border-[#7b2430] text-[color:var(--section-navigation-color,#7b2430)]" : "border-transparent text-[color:var(--section-navigation-color,#383a33)] hover:border-[#7b2430] hover:text-[#7b2430]"}`}>{item.label}</Link>;
      })}
    </nav>
  );
}

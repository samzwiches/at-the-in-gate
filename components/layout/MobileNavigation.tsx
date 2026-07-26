"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import AccountMenu from "@/components/auth/AccountMenu";
import { siteNavigation } from "@/lib/placeholder-data";

type MobileNavigationProps = {
  authenticated: boolean;
  isAdmin?: boolean;
};

export default function MobileNavigation({ authenticated, isAdmin = false }: MobileNavigationProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.open && !menuRef.current.contains(event.target as Node)) closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <details ref={menuRef} className="relative lg:hidden">
      <summary className="section-appearance-body-font cursor-pointer list-none border border-[#242721]/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] marker:content-none">
        Menu
      </summary>
      <nav className="absolute right-0 z-20 mt-2 w-52 border border-[#242721]/20 bg-[#f9f5ed] p-2 shadow-[4px_4px_0_0_rgba(45,71,55,0.14)]" aria-label="Mobile navigation">
        {siteNavigation.map((item) => (
          <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined} className={`section-appearance-body-font block px-3 py-2.5 text-sm font-medium hover:bg-[#e5ddd0] ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bg-[#e5ddd0] text-[color:var(--section-navigation-color,#7b2430)]" : "text-[color:var(--section-navigation-color,#383a33)]"}`}>
            {item.label}
          </Link>
        ))}
        <div className="mt-1 border-t border-[#242721]/15 pt-1">
          <Link href="/marketplace" onClick={closeMenu} className="section-appearance-body-font block px-3 py-2.5 text-sm font-medium text-[color:var(--section-navigation-color,#383a33)] hover:bg-[#e5ddd0]">
            Search
          </Link>
          <AccountMenu authenticated={authenticated} isAdmin={isAdmin} mobile onNavigate={closeMenu} />
        </div>
        <Link href="/marketplace/new" onClick={closeMenu} className="mt-1 block bg-[#2d4737] px-3 py-2.5 text-sm font-semibold text-[#f9f4eb]">
          Post a listing
        </Link>
      </nav>
    </details>
  );
}

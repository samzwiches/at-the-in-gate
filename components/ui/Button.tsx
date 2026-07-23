import type { ReactNode } from "react";
import Link from "next/link";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "utility";
  className?: string;
};

const variants = {
  primary: "inline-flex items-center justify-center gap-3 border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430]",
  secondary: "inline-flex items-center justify-center gap-3 border border-[#242721]/35 px-5 py-3 text-sm font-bold text-[color:var(--section-button-color,#2c3029)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]",
  utility: "inline-flex items-center gap-2 border-b border-[#2d4737] pb-1 text-sm font-semibold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]",
};

export default function Button({ href, children, variant = "primary", className = "" }: ButtonProps) {
  return <Link href={href} className={`${variants[variant]} ${className}`}>{children}</Link>;
}

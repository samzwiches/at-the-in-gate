import type { ReactNode } from "react";

export default function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1344px] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}

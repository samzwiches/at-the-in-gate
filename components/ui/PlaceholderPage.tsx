import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import PageContainer from "@/components/layout/PageContainer";

type PlaceholderLink = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
  planned,
  children,
  links = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  planned: string;
  children?: ReactNode;
  links?: PlaceholderLink[];
}) {
  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#56584f]">{description}</p>

          <section className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-6 sm:p-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">What will live here</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#4f514a]">{planned}</p>
            {children ? <div className="mt-6 border-t border-[#242721]/15 pt-6">{children}</div> : null}
            {links.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {links.map((link) => (
                  <Button key={link.href} href={link.href} variant={link.variant ?? "primary"}>{link.label} <span aria-hidden="true">↗</span></Button>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

import Link from "next/link";
import SiteMediaEditor from "@/components/admin/SiteMediaEditor";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { requireAdministrator } from "@/lib/membership/require-active-membership";
import { getSiteSectionAppearancesForAdmin } from "@/lib/supabase/site-section-appearance";
import { getSiteMediaForAdmin } from "@/lib/supabase/site-media";

export default async function SiteMediaAdminPage() {
  await requireAdministrator("/admin/site-media");
  const [media, appearances] = await Promise.all([
    getSiteMediaForAdmin(),
    getSiteSectionAppearancesForAdmin(),
  ]);

  return (
    <main className="bg-[#e7e1d5] py-12 sm:py-16">
      <PageContainer>
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Site media" }]} />
        <header className="mt-8 border-b border-[#242721]/20 pb-8">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">The picture desk</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Keep the pages looking like the horse world.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#56584f]">These fixed slots preserve the site&apos;s layout while letting you replace approved page imagery, crop it deliberately, and set a tightly controlled text treatment for the words sitting over it. There is no freeform styling here—just the media and appearance decisions that matter.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/admin" className="inline-flex border-b border-[#2d4737] pb-1 text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Back to the in-gate desk</Link>
            <Link href="/" className="inline-flex border-b border-[#2d4737] pb-1 text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View the home page</Link>
          </div>
        </header>

        <p className="mt-7 border border-[#b08d57]/55 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">JPG, PNG, and WebP only; uploads are limited to 6 MB. Every file receives a server-generated storage path, and replacing a slot removes its unreferenced prior file.</p>
        <SiteMediaEditor media={media} appearances={appearances} />
      </PageContainer>
    </main>
  );
}

import Link from "next/link";
import CategoryNav from "@/components/ui/CategoryNav";
import DirectoryEntryCard from "@/components/directory/DirectoryEntryCard";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import EmptyState from "@/components/ui/EmptyState";
import { getPublishedDirectoryEntries } from "@/lib/supabase/directory";
import { directoryCategories } from "@/lib/taxonomy";

export default async function DirectoryPage() {
  const entries = await getPublishedDirectoryEntries();
  const categoryItems = [{ label: "All", href: "/directory" }, ...directoryCategories.map((category) => ({ label: category.label, href: `/directory/category/${category.slug}` }))];

  return (
    <PageCanvas appearanceKey="directory.page" tone="warm" className="py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="directory.hero">
          <header className="flex flex-col gap-7 border-b border-[#242721]/20 pb-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">The good people list</p>
              <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">The people who make the whole thing go.</h1>
              <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">A clear place to find the trainers, barns, shippers, photographers, and veterinarians working in the hunter-jumper world.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/directory/new" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#7b2430]">Add a directory listing <span className="ml-2" aria-hidden="true">↗</span></Link>
              <Link href="/directory/mine" className="inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Manage my directory entries</Link>
              <Link href="#directory-entries" className="inline-flex border-b border-[#2d4737] px-1 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Explore services</Link>
            </div>
          </header>
        </PageHero>

        <section className="mt-7 border-y border-[#242721]/20 py-4">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Explore services</p>
          <div className="mt-3"><CategoryNav ariaLabel="Directory categories" items={categoryItems} activeHref="/directory" /></div>
        </section>

        <section id="directory-entries" className="mt-10" aria-labelledby="directory-entries-title">
          <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4">
            <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Approved listings</p><h2 id="directory-entries-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">The current book.</h2></div>
            <p className="text-sm font-semibold text-[#56584f]">{entries.length} {entries.length === 1 ? "listing" : "listings"}</p>
          </div>
          {entries.length > 0 ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{entries.map((entry) => <DirectoryEntryCard key={entry.id} entry={entry} />)}</div> : <div className="mt-6"><EmptyState eyebrow="The book is open" title="No approved directory listings yet." description="The first published entry will appear here after it has been reviewed." action={<Link href="/directory/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Add a directory listing <span className="ml-2" aria-hidden="true">↗</span></Link>} /></div>}
        </section>
      </PageContainer>
    </PageCanvas>
  );
}

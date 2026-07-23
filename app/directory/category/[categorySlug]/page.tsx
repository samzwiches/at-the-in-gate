import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryNav from "@/components/ui/CategoryNav";
import DirectoryEntryCard from "@/components/directory/DirectoryEntryCard";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { directoryCategories, getTaxonomyItem } from "@/lib/taxonomy";
import { getPublishedDirectoryEntriesForCategory } from "@/lib/supabase/directory";

type DirectoryCategoryPageProps = { params: Promise<{ categorySlug: string }> };

export default async function DirectoryCategoryPage({ params }: DirectoryCategoryPageProps) {
  const { categorySlug } = await params;
  const category = getTaxonomyItem(directoryCategories, categorySlug);
  if (!category) notFound();
  const entries = await getPublishedDirectoryEntriesForCategory(category.slug);
  const categoryItems = [{ label: "All", href: "/directory" }, ...directoryCategories.map((item) => ({ label: item.label, href: `/directory/category/${item.slug}` }))];
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-6xl"><Breadcrumbs items={[{ label: "Directory", href: "/directory" }, { label: category.label }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Directory category</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{category.label}.</h1></header><div className="mt-6"><CategoryNav ariaLabel="Directory categories" items={categoryItems} activeHref={`/directory/category/${category.slug}`} /></div>{entries.length > 0 ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{entries.map((entry) => <DirectoryEntryCard key={entry.id} entry={entry} />)}</div> : <div className="mt-10"><EmptyState eyebrow="No matching entries" title={`No approved ${category.label.toLowerCase()} are listed.`} description="Published entries in this category will appear here." /></div>}</div></PageContainer></main>;
}

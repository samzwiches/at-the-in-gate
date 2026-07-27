import DirectoryEntryForm from "@/components/directory/DirectoryEntryForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";

export default async function NewDirectoryEntryPage() {
  await requireActiveMembership("/directory/new");
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Directory", href: "/directory" }, { label: "Add a listing" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Add a directory listing</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Put the useful details in one place.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">Save a draft while you gather the details, or send the listing for review when it is ready.</p></header><DirectoryEntryForm /></div></PageContainer></main>;
}

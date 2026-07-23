import PageContainer from "@/components/layout/PageContainer";

export default function CommunityLoading() {
  return (
    <main className="bg-[#dce4e4] py-12 sm:py-16" aria-busy="true" aria-label="Loading community">
      <PageContainer>
        <div className="mx-auto max-w-4xl animate-pulse"><div className="h-3 w-28 bg-[#7b2430]/20" /><div className="mt-5 h-16 max-w-xl bg-[#242721]/10" /><div className="mt-10 grid gap-5 sm:grid-cols-2"><div className="h-56 border border-[#242721]/15 bg-[#edf1f0]" /><div className="h-56 border border-[#242721]/15 bg-[#edf1f0]" /></div></div>
      </PageContainer>
    </main>
  );
}

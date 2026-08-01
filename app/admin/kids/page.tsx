import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import { moderateKidsCreation } from "@/app/admin/kids/actions";
import { getKidsCreationsForModeration } from "@/lib/kids/queries";
import {
  kidsAgeGroupLabels,
  kidsCategoryLabels,
  type KidsCreationView,
  type KidsModerationStatus,
} from "@/lib/kids/types";
import { requireAdministrator } from "@/lib/membership/require-active-membership";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function moderationButton(
  creation: KidsCreationView,
  status: KidsModerationStatus,
  label: string,
  className: string
) {
  if (creation.moderation_status === status) return null;

  return (
    <form action={moderateKidsCreation}>
      <input type="hidden" name="creation_id" value={creation.id} />
      <input type="hidden" name="moderation_status" value={status} />
      <button type="submit" className={className}>{label}</button>
    </form>
  );
}

export default async function AdminKidsPage() {
  const { user } = await requireAdministrator("/admin/kids");
  const supabase = await createClient();
  const creations = await getKidsCreationsForModeration(supabase, user.id);
  const ordered = [...creations].sort((a, b) => {
    if (a.moderation_status === "pending" && b.moderation_status !== "pending") return -1;
    if (a.moderation_status !== "pending" && b.moderation_status === "pending") return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  const pendingCount = creations.filter((creation) => creation.moderation_status === "pending").length;

  return (
    <main className="bg-[#e7e1d5] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 border-b border-[#242721]/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">Administrator desk · Pony Kids Club</p>
              <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Review The Pony Pages.</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#56584f]">Check the words, artwork, broad age group, and privacy details before anything reaches the member gallery.</p>
            </div>
            <Link href="/admin" className="w-fit border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]">Back to admin desk</Link>
          </div>

          <section className="mt-8 grid border-l border-t border-[#242721]/20 sm:grid-cols-3">
            <article className="border-b border-r border-[#242721]/20 bg-[#f9f5ed] p-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Waiting for review</p><p className="mt-3 font-serif text-4xl text-[#2d4737]">{pendingCount}</p></article>
            <article className="border-b border-r border-[#242721]/20 bg-[#f9f5ed] p-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Published</p><p className="mt-3 font-serif text-4xl text-[#2d4737]">{creations.filter((creation) => creation.moderation_status === "published").length}</p></article>
            <article className="border-b border-r border-[#242721]/20 bg-[#f9f5ed] p-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">All submissions</p><p className="mt-3 font-serif text-4xl text-[#2d4737]">{creations.length}</p></article>
          </section>

          <section className="mt-8 space-y-6">
            {ordered.length ? ordered.map((creation) => (
              <article key={creation.id} className="overflow-hidden border border-[#242721]/20 bg-[#f9f5ed] lg:grid lg:grid-cols-[22rem_1fr]">
                <div className="border-b border-[#242721]/15 bg-[#ece7dc] lg:border-b-0 lg:border-r">
                  {creation.imageUrl ? (
                    <img src={creation.imageUrl} alt={creation.image_alt_text || creation.title} className="max-h-[32rem] w-full object-contain" />
                  ) : (
                    <div className="grid min-h-64 place-items-center p-6 text-center text-sm leading-6 text-[#686a61]">Written submission with no artwork image.</div>
                  )}
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[#7b2430]"><span>{creation.moderation_status}</span><span aria-hidden="true">·</span><span>{kidsCategoryLabels[creation.category]}</span><span aria-hidden="true">·</span><span>{kidsAgeGroupLabels[creation.child_age_group]}</span></div>
                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#242721]">{creation.title}</h2>
                  <p className="mt-2 text-sm font-semibold text-[#2d4737]">By {creation.child_display_name}</p>
                  {creation.body ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#50564e]">{creation.body}</p> : null}
                  <div className="mt-6 border-y border-[#242721]/15 py-4 text-xs leading-6 text-[#686a61]"><p>Submitted {formatDate(creation.created_at)}</p><p>Parent account: {creation.parentName}{creation.parentUsername ? ` · @${creation.parentUsername}` : ""}</p><p>Guardian attestation: {creation.guardian_attested ? "confirmed" : "missing"}</p>{creation.image_alt_text ? <p>Image description: {creation.image_alt_text}</p> : null}</div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {moderationButton(creation, "published", "Publish", "border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] hover:bg-[#7b2430]")}
                    {moderationButton(creation, "hidden", "Hold for review", "border border-[#b08d57] px-4 py-2.5 text-sm font-bold text-[#62543a] hover:bg-[#f8f0dc]")}
                    {moderationButton(creation, "removed", "Remove", "border border-[#7b2430] px-4 py-2.5 text-sm font-bold text-[#7b2430] hover:bg-[#7b2430] hover:text-[#f9f4eb]")}
                    {moderationButton(creation, "pending", "Return to pending", "border border-[#242721]/30 px-4 py-2.5 text-sm font-bold text-[#50564e]")}
                  </div>
                </div>
              </article>
            )) : (
              <p className="border border-dashed border-[#2d4737]/40 bg-[#edf1f0] p-6 text-sm leading-6 text-[#56584f]">The Pony Pages review basket is empty.</p>
            )}
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

import Link from "next/link";
import ReviewArchiveButton from "@/components/reviews/ReviewArchiveButton";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { reviewTargetLabel } from "@/lib/relationships";
import { getReviewsForAuthor, reviewTargetFromRow } from "@/lib/supabase/reviews";

export default async function MyReviewsPage() {
  const user = await requireUser("/reviews/mine");
  const reviews = await getReviewsForAuthor(user.id);
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">My reference book</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your reviews.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">Drafts, submissions, approved reviews, and notes you have archived.</p>{reviews.length > 0 ? <div className="mt-8 space-y-4">{reviews.map((review) => { const target = reviewTargetFromRow(review); return <article key={review.id} className="flex flex-col gap-4 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{review.deleted_at ? "archived" : review.moderation_status} · {target ? reviewTargetLabel(target.type) : "record"}</p><h2 className="mt-2 font-serif text-2xl text-[#242721]">{review.title ?? `${review.rating}-star review`}</h2><p className="mt-1 line-clamp-2 text-sm text-[#56584f]">{review.body}</p></div>{!review.deleted_at ? <div className="flex flex-wrap gap-3"><Link href={`/reviews/${review.id}/edit`} className="border border-[#2d4737] px-3 py-2 text-sm font-bold text-[#2d4737]">Edit</Link><ReviewArchiveButton reviewId={review.id} /></div> : null}</article>; })}</div> : <div className="mt-8"><EmptyState eyebrow="Your reference book is clear" title="You have not written a review yet." description="Start from a public listing, provider, event, or route when you have something useful to share." action={<Link href="/directory" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Browse the directory</Link>} /></div>}</div></PageContainer></main>;
}

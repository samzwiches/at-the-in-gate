import Link from "next/link";
import type { Review } from "@/lib/supabase/reviews";

function stars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function ReviewSection({ reviews, targetType, targetId, targetName }: { reviews: Review[]; targetType: string; targetId: string; targetName: string }) {
  const href = `/reviews/new?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}&targetName=${encodeURIComponent(targetName)}`;
  return <section className="mt-10 border-t border-[#242721]/20 pt-8" aria-labelledby="reviews-title"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">References and reviews</p><h2 id="reviews-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">What people have shared.</h2></div><Link href={href} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Write a review</Link></div>{reviews.length > 0 ? <div className="mt-6 grid gap-4 md:grid-cols-2">{reviews.map((review) => <article key={review.id} className="border border-[#242721]/20 bg-[#f9f5ed] p-5"><p className="text-sm tracking-[0.16em] text-[#b08d57]" aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</p>{review.title ? <h3 className="mt-3 font-serif text-2xl text-[#242721]">{review.title}</h3> : null}<p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#56584f]">{review.body}</p><p className="mt-4 text-xs text-[#686a61]">Verified submission · {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(review.created_at))}</p></article>)}</div> : <p className="mt-5 text-sm leading-6 text-[#56584f]">No approved reviews have been shared yet. Be the first to leave a clear, fair note.</p>}</section>;
}

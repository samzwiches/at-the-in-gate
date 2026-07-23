import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewForm from "@/components/reviews/ReviewForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { reviewTargetFromRow, getReviewForAuthor } from "@/lib/supabase/reviews";
import { reviewTargetLabel } from "@/lib/relationships";

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/reviews/${id}/edit`);
  const review = await getReviewForAuthor(id, user.id);
  if (!review || review.deleted_at) notFound();
  const target = reviewTargetFromRow(review);
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Reviews", href: "/reviews" }, { label: "My reviews", href: "/reviews/mine" }, { label: "Edit" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Edit review</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Keep the note clear.</h1></header><ReviewForm review={review} targetName={target ? reviewTargetLabel(target.type) : "This record"} /><Link href="/reviews/mine" className="mt-7 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Back to my reviews</Link></div></PageContainer></main>;
}

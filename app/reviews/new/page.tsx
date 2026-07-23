import { notFound } from "next/navigation";
import ReviewForm from "@/components/reviews/ReviewForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { reviewTargetLabel } from "@/lib/relationships";

const targetTypes = ["directory_entry", "listing", "service_offering", "shipping_route", "event"];

export default async function NewReviewPage({ searchParams }: { searchParams: Promise<{ targetType?: string; targetId?: string; targetName?: string }> }) {
  const params = await searchParams;
  if (!params.targetType || !params.targetId || !targetTypes.includes(params.targetType)) notFound();
  await requireUser(`/reviews/new?targetType=${encodeURIComponent(params.targetType)}&targetId=${encodeURIComponent(params.targetId)}`);
  const targetName = params.targetName?.slice(0, 180) || reviewTargetLabel(params.targetType);
  return <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><Breadcrumbs items={[{ label: "Reviews", href: "/reviews" }, { label: "Write a review" }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Write a review</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Leave the useful version.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#56584f]">A clear note is more helpful than a whisper. Reviews are moderated before they appear publicly.</p></header><ReviewForm targetType={params.targetType} targetId={params.targetId} targetName={targetName} /></div></PageContainer></main>;
}

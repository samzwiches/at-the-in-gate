import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import { reviewTargetFromRow, getPublishedReviews } from "@/lib/supabase/reviews";
import { reviewTargetLabel } from "@/lib/relationships";

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="reviews.hero" appearanceKey="directory.hero">
          <header className="flex flex-col gap-7 border-b border-[#242721]/20 pb-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">References and reviews</p>
              <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">The useful kind of horse-world feedback.</h1>
              <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Clear, moderated notes connected to a real listing, service, shipper, event, or directory identity.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/reviews/mine" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#7b2430]">Manage my reviews</Link>
              <Link href="#published-reviews" className="inline-flex border-b border-[#2d4737] px-1 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Read the reference book</Link>
            </div>
          </header>
        </PageHero>

        {reviews.length > 0 ? (
          <section id="published-reviews" className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => {
              const target = reviewTargetFromRow(review);
              return (
                <article key={review.id} className="border border-[#242721]/20 bg-[#f9f5ed] p-5">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{target ? reviewTargetLabel(target.type) : "Review"}</p>
                  <p className="mt-4 text-sm tracking-[0.16em] text-[#b08d57]" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                  {review.title ? <h2 className="mt-3 font-serif text-2xl text-[#242721]">{review.title}</h2> : null}
                  <p className="mt-3 line-clamp-5 text-sm leading-7 text-[#56584f]">{review.body}</p>
                </article>
              );
            })}
          </section>
        ) : (
          <div id="published-reviews" className="mt-10">
            <EmptyState eyebrow="The reference book is clear" title="No approved reviews are posted." description="Reviews begin from the listing, event, provider, or route they are actually about." action={<Link href="/directory" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Browse the directory</Link>} />
          </div>
        )}
      </PageContainer>
    </main>
  );
}

import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import { reviewTargetLabel } from "@/lib/relationships";
import { reviewTargetFromRow, getPublishedReviews } from "@/lib/supabase/reviews";
import { getShowCrewFeedbackFeed } from "@/lib/supabase/show-crew";

function publicPersonName(person: { is_public: boolean; display_name: string | null; username: string | null } | null) {
  if (!person?.is_public) return "At The In Gate member";
  return person.display_name || person.username || "At The In Gate member";
}

export default async function ReviewsPage() {
  const [reviews, showCrewFeedback] = await Promise.all([
    getPublishedReviews(),
    getShowCrewFeedbackFeed(),
  ]);
  const hasReviews = reviews.length > 0 || showCrewFeedback.length > 0;

  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16">
      <PageContainer>
        <PageHero mediaKey="reviews.hero" appearanceKey="directory.hero">
          <header className="flex flex-col gap-7 border-b border-[#242721]/20 pb-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">References and reviews</p>
              <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">The useful kind of horse-world feedback.</h1>
              <p className="section-appearance-body-font mt-5 text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Moderated notes connected to real listings and services, plus verified reviews from completed Show Crew connections.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/reviews/mine" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#f9f4eb)] transition-colors hover:bg-[#7b2430]">Manage my reviews</Link>
              <Link href="#published-reviews" className="inline-flex border-b border-[#2d4737] px-1 py-2.5 text-sm font-bold text-[color:var(--section-button-color,#2d4737)] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Read the reference book</Link>
            </div>
          </header>
        </PageHero>

        {hasReviews ? (
          <div id="published-reviews" className="mt-10 space-y-10">
            {showCrewFeedback.length > 0 ? (
              <section aria-labelledby="verified-show-crew-title">
                <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4">
                  <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Verified connections</p><h2 id="verified-show-crew-title" className="mt-2 font-serif text-3xl text-[#242721]">Completed Show Crew work.</h2></div>
                  <p className="text-sm font-semibold text-[#56584f]">{showCrewFeedback.length} verified</p>
                </div>
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {showCrewFeedback.map((feedback) => (
                    <article key={feedback.id} className="border border-[#b08d57]/40 bg-[#efe8dc] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">Verified Show Crew</p>
                        <span className="border border-[#b08d57] px-2 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#7b2430]">Completed</span>
                      </div>
                      <p className="mt-4 text-sm tracking-[0.16em] text-[#b08d57]" aria-label={`${feedback.rating} out of 5 stars`}>{"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}</p>
                      <h3 className="mt-3 font-serif text-2xl text-[#242721]">{publicPersonName(feedback.worker)}</h3>
                      {feedback.job ? <Link href={`/jobs/${feedback.job.slug}`} className="mt-2 inline-flex text-sm font-semibold text-[#2d4737] transition-colors hover:text-[#7b2430]">{feedback.job.title} · {feedback.job.employer}</Link> : null}
                      <p className="mt-4 line-clamp-6 text-sm leading-7 text-[#56584f]">{feedback.body}</p>
                      <div className="mt-5 grid grid-cols-3 gap-px border border-[#242721]/15 text-xs"><p className="bg-[#f9f5ed] p-2 text-[#56584f]">Reliable <strong className="block text-[#2d4737]">{feedback.reliability_rating}/5</strong></p><p className="bg-[#f9f5ed] p-2 text-[#56584f]">Communicated <strong className="block text-[#2d4737]">{feedback.communication_rating}/5</strong></p><p className="bg-[#f9f5ed] p-2 text-[#56584f]">Horse care <strong className="block text-[#2d4737]">{feedback.horse_care_rating}/5</strong></p></div>
                      <p className="mt-4 text-xs font-bold text-[#2d4737]">{feedback.would_hire_again ? "Would hire again" : "Would not hire again"}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {reviews.length > 0 ? (
              <section aria-labelledby="community-reviews-title">
                <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Community references</p><h2 id="community-reviews-title" className="mt-2 font-serif text-3xl text-[#242721]">Listings, services, events, and routes.</h2></div><p className="text-sm font-semibold text-[#56584f]">{reviews.length} approved</p></div>
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {reviews.map((review) => {
                    const target = reviewTargetFromRow(review);
                    return (
                      <article key={review.id} className="border border-[#242721]/20 bg-[#f9f5ed] p-5">
                        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{target ? reviewTargetLabel(target.type) : "Review"}</p>
                        <p className="mt-4 text-sm tracking-[0.16em] text-[#b08d57]" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                        {review.title ? <h3 className="mt-3 font-serif text-2xl text-[#242721]">{review.title}</h3> : null}
                        <p className="mt-3 line-clamp-5 text-sm leading-7 text-[#56584f]">{review.body}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div id="published-reviews" className="mt-10">
            <EmptyState eyebrow="The reference book is clear" title="No approved reviews are posted." description="Reviews begin from a listing, event, provider, route, or completed Show Crew connection." action={<Link href="/directory" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Browse the directory</Link>} />
          </div>
        )}
      </PageContainer>
    </main>
  );
}

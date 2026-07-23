import Link from "next/link";
import ManageBillingButton from "@/components/membership/ManageBillingButton";
import SubscribeButton from "@/components/membership/SubscribeButton";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { getMembershipForProfile } from "@/lib/membership/membership";

type MembershipPageProps = {
  searchParams: Promise<{ checkout?: string | string[]; next?: string | string[] }>;
};

function membershipStatusCopy(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "Active member";
    case "trialing":
      return "Trial membership";
    case "past_due":
      return "Payment needs attention";
    case "canceled":
    case "ended":
      return "Membership ended";
    default:
      return "Membership not active";
  }
}

export default async function MembershipPage({ searchParams }: MembershipPageProps) {
  const { checkout, next } = await searchParams;
  const user = await getAuthenticatedUser();
  const nextPath = getSafeNextPath(next, "/community");
  const membership = user ? await getMembershipForProfile(user.id) : null;
  const checkoutSucceeded = checkout === "success";
  const checkoutCancelled = checkout === "cancelled";

  return (
    <PageCanvas appearanceKey="membership.page" tone="cream" className="py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-5xl">
          <PageHero mediaKey="membership.hero">
          <header className="border-b border-[#242721]/20 pb-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">Member pass</p>
            <h1 className="section-appearance-heading-font mt-4 max-w-3xl text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">A place to talk shop after the last trip.</h1>
            <p className="section-appearance-body-font mt-5 max-w-2xl text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Membership opens the native At The In Gate community: useful horse-show knowledge, buyer and seller perspective, and a little room for the conversations that usually live by the in gate.</p>
          </header>
          </PageHero>

          {checkoutSucceeded ? (
            <p role="status" className="mt-7 border border-[#2d4737]/35 bg-[#e5eee7] px-4 py-3 text-sm leading-6 text-[#2d4737]">Thank you. Payment confirmation may take a moment while Stripe&apos;s webhook updates your membership. Refresh this page shortly if community access has not appeared yet.</p>
          ) : null}
          {checkoutCancelled ? <p role="status" className="mt-7 border border-[#b08d57]/45 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">Checkout was not completed. Nothing has changed, and you can return whenever you are ready.</p> : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
            <section className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">One membership, to begin</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-[#242721]">The community is for people who know the difference between a warm-up ring and a good idea.</h2>
              <ul className="mt-7 space-y-3 border-t border-[#242721]/15 pt-5 text-sm leading-6 text-[#50564e]">
                <li>Thoughtful conversation across the hunter, jumper, equitation, and pony worlds.</li>
                <li>Practical notes on buying, leasing, showing, shipping, barn life, and working students.</li>
                <li>Member-only access inside the existing At The In Gate site.</li>
              </ul>
            </section>

            <aside className="border border-[#2d4737] bg-[#2d4737] p-5 text-[#f9f4eb] sm:p-7">
              {!user ? (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Start here</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">Sign in before you take your place at the rail.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Your membership is tied to your At The In Gate account, not a browser or a shared link.</p>
                  <Link href="/sign-in?next=%2Fmembership" className="mt-7 inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Sign in to subscribe</Link>
                </>
              ) : membership?.isAdmin ? (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Administrator access</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">You&apos;re through the gate.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Your administrator role provides community access without a paid membership. Billing stays separate unless you have deliberately opened a Stripe membership.</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={nextPath} className="inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Open community</Link>
                    {membership.hasStripeCustomer ? <ManageBillingButton className="border-[#f9f4eb] text-[#f9f4eb] hover:border-[#d8bd85] hover:text-[#d8bd85]" /> : null}
                  </div>
                </>
              ) : membership?.isEntitled ? (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">{membershipStatusCopy(membership.subscription?.status)}</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">You&apos;re through the gate.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Your community access is active. {membership.subscription?.cancel_at_period_end ? "Your current period remains open through its end date." : "We’ll keep the useful conversations waiting for you."}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={nextPath} className="inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Open community</Link>
                    {membership.hasStripeCustomer ? <ManageBillingButton className="border-[#f9f4eb] text-[#f9f4eb] hover:border-[#d8bd85] hover:text-[#d8bd85]" /> : null}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Membership access</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">Pull up a chair by the rail.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Checkout is handled securely by Stripe. Community access begins only after the verified billing update arrives.</p>
                  <div className="mt-7"><SubscribeButton authenticated /></div>
                </>
              )}
            </aside>
          </div>

          <section className="mt-6 border border-[#242721]/20 bg-[#edf1f0] p-5 sm:p-7">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Good barn rules still apply</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#56584f]">Membership supports a community that is candid, practical, and kind. Members can post, comment, react, report concerns, and manage their own contributions.</p>
          </section>
        </div>
      </PageContainer>
    </PageCanvas>
  );
}

import Link from "next/link";
import ManageBillingButton from "@/components/membership/ManageBillingButton";
import SubscribeButton from "@/components/membership/SubscribeButton";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { getMembershipForProfileSafely } from "@/lib/membership/membership";

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

function requestedAccessCopy(nextPath: string) {
  if (nextPath.startsWith("/community")) {
    return "The community, its rooms, and its conversations are reserved for active members.";
  }

  const creationAccess: Record<string, string> = {
    "/marketplace/new": "Posting a marketplace listing is a member benefit.",
    "/directory/new": "Adding a directory listing is a member benefit.",
    "/services/new": "Publishing a service is a member benefit.",
    "/shippers/new": "Publishing a shipping route is a member benefit.",
    "/jobs/new": "Posting a job is a member benefit.",
    "/events/new": "Adding an event to the show calendar is a member benefit.",
    "/reviews/new": "Writing a public review is a member benefit.",
    "/shop/new": "Submitting an item to the shop board is a member benefit.",
  };

  return creationAccess[nextPath.split("?")[0]] ?? "That part of At The In Gate is reserved for active members.";
}

export default async function MembershipPage({ searchParams }: MembershipPageProps) {
  const { checkout, next } = await searchParams;
  const user = await getAuthenticatedUser();
  const nextPath = getSafeNextPath(next, "/community");
  const membershipLookup = user ? await getMembershipForProfileSafely(user.id) : null;
  const membership = membershipLookup?.membership ?? null;
  const membershipWarning = membershipLookup?.warning ?? null;
  const checkoutSucceeded = checkout === "success";
  const checkoutCancelled = checkout === "cancelled";
  const arrivedAtPaywall = typeof next === "string" || Array.isArray(next);
  const signInHref = `/sign-in?${new URLSearchParams({ next: nextPath })}`;

  return (
    <PageCanvas appearanceKey="membership.page" tone="cream" className="py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-5xl">
          <PageHero mediaKey="membership.hero">
            <header className="border-b border-[#242721]/20 pb-8">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">Member pass</p>
              <h1 className="section-appearance-heading-font mt-4 max-w-3xl text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">More than a login. A place at the rail.</h1>
              <p className="section-appearance-body-font mt-5 max-w-2xl text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Membership opens the At The In Gate community and the tools that let you contribute to the boards, calendar, directory, reviews, and working horse-world network.</p>
            </header>
          </PageHero>

          {arrivedAtPaywall && !checkoutSucceeded ? <p role="status" className="mt-7 border border-[#7b2430]/35 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#6f2630]"><strong>Membership required.</strong> {requestedAccessCopy(nextPath)}</p> : null}
          {checkoutSucceeded ? (
            <p role="status" className="mt-7 border border-[#2d4737]/35 bg-[#e5eee7] px-4 py-3 text-sm leading-6 text-[#2d4737]">Thank you. Payment confirmation may take a moment while Stripe updates your membership. Once it lands, continue to the page you were opening.</p>
          ) : null}
          {checkoutCancelled ? <p role="status" className="mt-7 border border-[#b08d57]/45 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">Checkout was not completed. Nothing was charged, and you can return whenever you are ready.</p> : null}
          {membershipWarning ? <p role="status" className="mt-7 border border-[#b08d57]/45 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">{membershipWarning}</p> : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
            <section className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">What the pass opens</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-[#242721]">The useful parts of the horse world, without making everyone shout across the aisle.</h2>
              <ul className="mt-7 space-y-3 border-t border-[#242721]/15 pt-5 text-sm leading-6 text-[#50564e]">
                <li>Full access to community rooms, posts, comments, reactions, and member conversations.</li>
                <li>Permission to post marketplace listings, directory entries, services, shipping routes, jobs, and events.</li>
                <li>Member submissions for public reviews and the curated shop board.</li>
                <li>Monthly or annual billing, with access tied to your At The In Gate account.</li>
              </ul>
            </section>

            <aside className="border border-[#2d4737] bg-[#2d4737] p-5 text-[#f9f4eb] sm:p-7">
              {!user ? (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Start here</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">Sign in before you take your place at the rail.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Your membership belongs to your account, so your access follows you instead of one browser or one shared link.</p>
                  <Link href={signInHref} className="mt-7 inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Sign in to continue</Link>
                </>
              ) : membershipWarning ? (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Account connected</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">Your sign-in worked.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">The membership database connection is not available to the server yet. Billing and administrator checks are paused until the Cloudflare runtime secret is restored.</p>
                  <Link href="/dashboard" className="mt-7 inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Open my dashboard</Link>
                </>
              ) : membership?.isAdmin ? (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Administrator access</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">You&apos;re through the gate.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Your administrator role includes member access without a paid subscription. Billing stays separate unless you deliberately open a Stripe membership.</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={nextPath} className="inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Continue where I left off</Link>
                    {membership.hasStripeCustomer ? <ManageBillingButton className="border-[#f9f4eb] text-[#f9f4eb] hover:border-[#d8bd85] hover:text-[#d8bd85]" /> : null}
                  </div>
                </>
              ) : membership?.isEntitled ? (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">{membershipStatusCopy(membership.subscription?.status)}</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">You&apos;re through the gate.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Your member access is active. {membership.subscription?.cancel_at_period_end ? "Your current access remains open through the end of the paid period." : "The community and contribution tools are ready when you are."}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={nextPath} className="inline-flex border border-[#f9f4eb] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#d8bd85] hover:text-[#d8bd85]">Continue where I left off</Link>
                    {membership.hasStripeCustomer ? <ManageBillingButton className="border-[#f9f4eb] text-[#f9f4eb] hover:border-[#d8bd85] hover:text-[#d8bd85]" /> : null}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#d8bd85]">Membership access</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">Choose your pass and keep moving.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#e2ddcf]">Checkout is handled securely by Stripe. Access begins after the verified billing update arrives.</p>
                  <div className="mt-7"><SubscribeButton authenticated /></div>
                </>
              )}
            </aside>
          </div>

          <section className="mt-6 border border-[#242721]/20 bg-[#edf1f0] p-5 sm:p-7">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Public browsing stays public</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#56584f]">Anyone can browse listings, events, directories, services, shipping routes, jobs, reviews, and shop finds. Membership is required to enter the community or add something to those public boards.</p>
          </section>
        </div>
      </PageContainer>
    </PageCanvas>
  );
}

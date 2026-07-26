import Link from "next/link";
import ManageBillingButton from "@/components/membership/ManageBillingButton";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getMembershipForProfileSafely } from "@/lib/membership/membership";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const { membership, warning: membershipWarning } = await getMembershipForProfileSafely(user.id);

  return (
    <main className="bg-[#eef1ed] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">Member account</p>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your spot at the in gate.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">Signed in as {user.email ?? "your member email"}. Account details and profile editing will come in a later pass.</p>
          {membership.isAdmin ? <p className="mt-4 inline-flex border border-[#b08d57] bg-[#f8f0dc] px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#62543a]">Administrator access</p> : null}
          {membershipWarning ? <p role="status" className="mt-5 border border-[#b08d57]/45 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">{membershipWarning}</p> : null}

          <section className="mt-8 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">A quiet placeholder, for now</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.025em] text-[#242721]">The basics will live here.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#56584f]">This page confirms that your member session is working. It does not edit a profile, store preferences, or expose any new member data yet.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430]">
                Go to my daybook
              </Link>
              {membership.isAdmin ? <Link href="/admin" className="inline-flex border border-[#2d4737] px-5 py-3 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Open admin desk</Link> : null}
              {!membershipWarning && membership.hasStripeCustomer ? <ManageBillingButton /> : null}
            </div>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

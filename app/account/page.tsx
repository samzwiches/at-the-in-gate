import Link from "next/link";
import ManageBillingButton from "@/components/membership/ManageBillingButton";
import FoundingMemberBadge from "@/components/members/FoundingMemberBadge";
import MemberAvatar from "@/components/members/MemberAvatar";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getMembershipForProfileSafely } from "@/lib/membership/membership";
import { getMemberProfileClient } from "@/lib/members/profile";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const supabase = await createClient();
  const profiles = getMemberProfileClient(supabase);
  const [{ membership, warning: membershipWarning }, { data: profile, error: profileError }] = await Promise.all([
    getMembershipForProfileSafely(user.id),
    profiles
      .from("profiles")
      .select("id, username, display_name, bio, location, avatar_path, is_public, founding_member, created_at, updated_at")
      .eq("id", user.id)
      .single(),
  ]);

  if (profileError || !profile) {
    throw new Error("Could not load your member profile.");
  }

  const profileComplete = Boolean(profile.username && profile.display_name);
  const isFoundingMember = profile.founding_member || membership.grant?.grant_type === "founding";
  const publicProfileHref = profile.username && profile.is_public ? `/members/${profile.username}` : null;

  return (
    <main className="bg-[#eef1ed] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">Member account</p>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your spot at the in gate.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">Signed in as {user.email ?? "your member email"}. This is where your public identity, membership, and useful shortcuts live.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {membership.isAdmin ? <p className="inline-flex border border-[#b08d57] bg-[#f8f0dc] px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#62543a]">Administrator access</p> : null}
            {isFoundingMember ? <FoundingMemberBadge /> : null}
          </div>
          {membershipWarning ? <p role="status" className="mt-5 border border-[#b08d57]/45 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">{membershipWarning}</p> : null}

          <section className="mt-8 grid border border-[#242721]/20 bg-[#f9f5ed] sm:grid-cols-[10rem_1fr]">
            <div className="grid place-items-center border-b border-[#242721]/15 bg-[#e7e1d5] p-6 sm:border-b-0 sm:border-r">
              <MemberAvatar profile={profile} size={112} />
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">My member profile</p>
              <h2 className="mt-3 font-serif text-3xl tracking-[-0.025em] text-[#242721]">
                {profileComplete ? profile.display_name : "Finish your stall card."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#56584f]">
                {profileComplete
                  ? `Your profile is ${profile.is_public ? "public" : "private"}${profile.username ? ` at @${profile.username}` : ""}. Keep your picture, location, and barn-aisle introduction current.`
                  : "Add your name, username, picture, location, and a short introduction before you start meeting the founding group."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/account/profile" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430]">
                  {profileComplete ? "Edit my profile" : "Create my profile"}
                </Link>
                {publicProfileHref ? <Link href={publicProfileHref} className="inline-flex border border-[#2d4737] px-5 py-3 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View public profile</Link> : null}
              </div>
            </div>
          </section>

          <section className="mt-6 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-7">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Membership and daybook</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.025em] text-[#242721]">The keys and the useful doors.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#56584f]">
              {membership.isComplimentary
                ? "Your complimentary founding access is active. No Stripe subscription or card is attached to this access."
                : "Use the daybook for your submissions and membership tools for billing."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] transition-colors hover:border-[#7b2430] hover:bg-[#7b2430]">Go to my daybook</Link>
              {membership.isAdmin ? <Link href="/admin" className="inline-flex border border-[#2d4737] px-5 py-3 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Open admin desk</Link> : null}
              {!membershipWarning && membership.hasStripeCustomer ? <ManageBillingButton /> : null}
            </div>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

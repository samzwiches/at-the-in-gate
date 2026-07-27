import Link from "next/link";
import { notFound } from "next/navigation";
import FoundingMemberBadge from "@/components/members/FoundingMemberBadge";
import MemberAvatar from "@/components/members/MemberAvatar";
import PageContainer from "@/components/layout/PageContainer";
import { getMemberProfileClient, getProfileDisplayName } from "@/lib/members/profile";
import { createClient } from "@/lib/supabase/server";

type PublicMemberProfilePageProps = {
  params: Promise<{ username: string }>;
};

function formatMemberSince(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function PublicMemberProfilePage({ params }: PublicMemberProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const profiles = getMemberProfileClient(supabase);
  const { data: profile, error } = await profiles
    .from("profiles")
    .select("id, username, display_name, bio, location, avatar_path, is_public, founding_member, created_at, updated_at")
    .eq("username", username.toLowerCase())
    .eq("is_public", true)
    .maybeSingle();

  if (error || !profile || !profile.username) {
    notFound();
  }

  const displayName = getProfileDisplayName(profile);

  return (
    <main className="bg-[#eef1ed] py-12 sm:py-16">
      <PageContainer>
        <article className="mx-auto max-w-4xl border border-[#242721]/20 bg-[#f9f5ed]">
          <div className="border-b border-[#242721]/15 bg-[#2d4737] px-6 py-5 text-[#f9f4eb] sm:px-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#d8bd85]">Member of the barn aisle</p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[18rem_1fr]">
            <aside className="border-b border-[#242721]/15 bg-[#e7e1d5] p-7 text-center lg:border-b-0 lg:border-r">
              <MemberAvatar profile={profile} size={176} className="mx-auto" />
              <p className="mt-5 text-sm font-semibold text-[#686a61]">@{profile.username}</p>
              {profile.founding_member ? <div className="mt-4"><FoundingMemberBadge /></div> : null}
              <dl className="mt-7 border-t border-[#242721]/15 pt-5 text-left text-sm leading-6 text-[#56584f]">
                {profile.location ? (
                  <div>
                    <dt className="font-bold text-[#2d4737]">Based around</dt>
                    <dd>{profile.location}</dd>
                  </div>
                ) : null}
                <div className={profile.location ? "mt-4" : ""}>
                  <dt className="font-bold text-[#2d4737]">At the in gate since</dt>
                  <dd>{formatMemberSince(profile.created_at)}</dd>
                </div>
              </dl>
            </aside>

            <div className="p-7 sm:p-10">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#7b2430]">The person behind the posts</p>
              <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">
                {displayName}
              </h1>
              {profile.bio ? (
                <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-[#50564e] sm:text-lg">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-6 text-base leading-8 text-[#686a61]">
                  This member has put their name on the stall card but has not added an introduction yet.
                </p>
              )}

              <div className="mt-10 border-t border-[#242721]/15 pt-6">
                <Link
                  href="/community"
                  className="inline-flex border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] hover:border-[#7b2430] hover:bg-[#7b2430]"
                >
                  Return to the community
                </Link>
              </div>
            </div>
          </div>
        </article>
      </PageContainer>
    </main>
  );
}

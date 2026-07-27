import Link from "next/link";
import FoundingMemberBadge from "@/components/members/FoundingMemberBadge";
import MemberAvatar from "@/components/members/MemberAvatar";
import PageContainer from "@/components/layout/PageContainer";
import { saveMemberProfile } from "@/app/account/profile/actions";
import { requireUser } from "@/lib/auth/require-user";
import { getMembershipForProfileSafely } from "@/lib/membership/membership";
import { getMemberProfileClient } from "@/lib/members/profile";
import { createClient } from "@/lib/supabase/server";

type ProfilePageProps = {
  searchParams: Promise<{
    saved?: string | string[];
    error?: string | string[];
  }>;
};

const inputClassName =
  "mt-2 w-full border border-[#242721]/25 bg-[#fffdf8] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default async function MemberProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireUser("/account/profile");
  const params = await searchParams;
  const saved = params.saved === "1";
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const supabase = await createClient();
  const profiles = getMemberProfileClient(supabase);
  const [{ data: profile, error: profileError }, { membership }] = await Promise.all([
    profiles
      .from("profiles")
      .select("id, username, display_name, bio, location, avatar_path, is_public, founding_member, created_at, updated_at")
      .eq("id", user.id)
      .single(),
    getMembershipForProfileSafely(user.id),
  ]);

  if (profileError || !profile) {
    throw new Error("Could not load the member profile editor.");
  }

  const isFoundingMember = profile.founding_member || membership.grant?.grant_type === "founding";
  const publicProfileHref = profile.username && profile.is_public ? `/members/${profile.username}` : null;

  return (
    <main className="bg-[#eef1ed] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6 border-b border-[#242721]/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">
                Member profile
              </p>
              <h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">
                Put a face by the stall card.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">
                Add the name horse people know, a clear picture, where you are based, and the useful part of your story.
              </p>
            </div>
            <Link
              href="/account"
              className="w-fit border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]"
            >
              Back to my account
            </Link>
          </div>

          {saved ? (
            <p role="status" className="mt-6 border border-[#2d4737]/35 bg-[#e5eee7] px-4 py-3 text-sm leading-6 text-[#2d4737]">
              Your profile is saved. The fresh stall card is on the board.
            </p>
          ) : null}
          {rawError ? (
            <p role="alert" className="mt-6 border border-[#7b2430]/40 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#7b2430]">
              {rawError}
            </p>
          ) : null}

          <section className="mt-8 grid gap-0 border border-[#242721]/20 bg-[#f9f5ed] lg:grid-cols-[17rem_1fr]">
            <aside className="border-b border-[#242721]/15 bg-[#e7e1d5] p-6 lg:border-b-0 lg:border-r">
              <MemberAvatar profile={profile} size={144} className="mx-auto" />
              <div className="mt-5 text-center">
                <p className="font-serif text-2xl text-[#242721]">
                  {profile.display_name?.trim() || "Your name goes here"}
                </p>
                <p className="mt-1 text-sm text-[#686a61]">
                  {profile.username ? `@${profile.username}` : "Choose a username"}
                </p>
                {isFoundingMember ? <div className="mt-4"><FoundingMemberBadge /></div> : null}
              </div>
              <div className="mt-6 border-t border-[#242721]/15 pt-5 text-sm leading-6 text-[#56584f]">
                <p className="font-bold text-[#2d4737]">What becomes public</p>
                <p className="mt-2">Your display name, username, picture, location, introduction, badge, and member-since date.</p>
                <p className="mt-3">Your email address is never shown on the public profile.</p>
              </div>
              {publicProfileHref ? (
                <Link
                  href={publicProfileHref}
                  className="mt-5 inline-flex border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]"
                >
                  View my public profile
                </Link>
              ) : null}
            </aside>

            <form action={saveMemberProfile} encType="multipart/form-data" className="p-6 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className={labelClassName}>
                  Display name
                  <input
                    name="display_name"
                    required
                    maxLength={100}
                    defaultValue={profile.display_name ?? ""}
                    placeholder="Sam Lawton Duthie"
                    className={inputClassName}
                  />
                </label>

                <label className={labelClassName}>
                  Username
                  <div className="mt-2 flex border border-[#242721]/25 bg-[#fffdf8] focus-within:border-[#2d4737]">
                    <span className="grid place-items-center border-r border-[#242721]/15 px-3 text-sm font-bold text-[#686a61]">@</span>
                    <input
                      name="username"
                      required
                      minLength={3}
                      maxLength={40}
                      pattern="[a-z0-9][a-z0-9_-]{2,39}"
                      defaultValue={profile.username ?? ""}
                      placeholder="barnaislename"
                      className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-[#242721] outline-none"
                    />
                  </div>
                  <span className="mt-1.5 block text-xs font-normal leading-5 text-[#686a61]">
                    Lowercase letters, numbers, underscores, and hyphens.
                  </span>
                </label>
              </div>

              <label className={`mt-6 block ${labelClassName}`}>
                Location
                <input
                  name="location"
                  maxLength={150}
                  defaultValue={profile.location ?? ""}
                  placeholder="Lexington, Kentucky · USEF Zone 5"
                  className={inputClassName}
                />
              </label>

              <label className={`mt-6 block ${labelClassName}`}>
                About me
                <textarea
                  name="bio"
                  maxLength={1000}
                  rows={7}
                  defaultValue={profile.bio ?? ""}
                  placeholder="Trainer, pony parent, braider, working student, show photographer, or simply the person who always knows where the missing crop went."
                  className={inputClassName}
                />
                <span className="mt-1.5 block text-xs font-normal leading-5 text-[#686a61]">
                  Keep it useful. Mention your role, experience, specialties, home circuit, or what brings you here.
                </span>
              </label>

              <fieldset className="mt-6 border border-[#242721]/20 bg-[#fffdf8] p-5">
                <legend className="px-2 text-sm font-semibold text-[#2d4737]">Profile picture</legend>
                <input
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-[#56584f] file:mr-4 file:border file:border-[#2d4737] file:bg-[#2d4737] file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-[#f9f4eb] hover:file:bg-[#7b2430]"
                />
                <p className="mt-2 text-xs leading-5 text-[#686a61]">JPG, PNG, or WebP. Maximum 4 MB. A square crop works best.</p>
                {profile.avatar_path ? (
                  <label className="mt-4 flex items-start gap-3 text-sm text-[#56584f]">
                    <input type="checkbox" name="remove_avatar" className="mt-1 size-4 accent-[#7b2430]" />
                    Remove my current profile picture
                  </label>
                ) : null}
              </fieldset>

              <label className="mt-6 flex items-start gap-3 border border-[#242721]/20 bg-[#fffdf8] p-5">
                <input
                  type="checkbox"
                  name="is_public"
                  defaultChecked={profile.is_public}
                  className="mt-1 size-4 accent-[#2d4737]"
                />
                <span>
                  <span className="block text-sm font-bold text-[#2d4737]">Show my member profile publicly</span>
                  <span className="mt-1 block text-sm leading-6 text-[#686a61]">
                    This lets other horse people open your profile from community posts and see the information above. Turn it off whenever you need a quieter stall.
                  </span>
                </span>
              </label>

              <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#242721]/15 pt-6">
                <button
                  type="submit"
                  className="border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] hover:border-[#7b2430] hover:bg-[#7b2430]"
                >
                  Save my profile
                </button>
                <p className="text-xs leading-5 text-[#686a61]">You can edit this any time from My account.</p>
              </div>
            </form>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

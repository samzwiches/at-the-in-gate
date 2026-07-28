import Link from "next/link";
import {
  deletePendingKidsCreation,
  submitKidsCreation,
  toggleKidsReaction,
} from "@/app/kids/actions";
import PageContainer from "@/components/layout/PageContainer";
import EmptyState from "@/components/ui/EmptyState";
import {
  getKidsCreationsForParent,
  getPublishedKidsCreations,
} from "@/lib/kids/queries";
import {
  kidsAgeGroupLabels,
  kidsAgeGroups,
  kidsCategoryLabels,
  kidsCreationCategories,
  kidsReactionLabels,
  kidsReactionTypes,
  type KidsCreationView,
} from "@/lib/kids/types";
import { requireActiveMembership } from "@/lib/membership/require-active-membership";
import { createClient } from "@/lib/supabase/server";

type KidsPageProps = {
  searchParams: Promise<{
    submitted?: string | string[];
    error?: string | string[];
  }>;
};

const inputClassName =
  "mt-2 w-full border border-[#242721]/25 bg-[#fffdf8] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: KidsCreationView["moderation_status"]) {
  if (status === "published") return "On The Pony Pages";
  if (status === "pending") return "Waiting for review";
  if (status === "hidden") return "Held for review";
  return "Not published";
}

function CreationArtwork({ creation }: { creation: KidsCreationView }) {
  if (!creation.imageUrl) return null;

  return (
    <div className="overflow-hidden border-b border-[#242721]/15 bg-[#ece7dc]">
      <img
        src={creation.imageUrl}
        alt={creation.image_alt_text || `${creation.title}, shared on The Pony Pages`}
        loading="lazy"
        className="max-h-[36rem] w-full object-contain"
      />
    </div>
  );
}

function CreationCard({ creation }: { creation: KidsCreationView }) {
  return (
    <article className="overflow-hidden border border-[#242721]/20 bg-[#f9f5ed]">
      <CreationArtwork creation={creation} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[#7b2430]">
          <span>{kidsCategoryLabels[creation.category]}</span>
          <span aria-hidden="true">·</span>
          <span>{kidsAgeGroupLabels[creation.child_age_group]}</span>
        </div>
        <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#242721]">
          {creation.title}
        </h2>
        <p className="mt-2 text-sm font-semibold text-[#2d4737]">
          By {creation.child_display_name}
        </p>
        {creation.body ? (
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#50564e] sm:text-base">
            {creation.body}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#242721]/15 pt-4 text-xs text-[#686a61]">
          <span>{formatDate(creation.created_at)}</span>
          <span aria-hidden="true">·</span>
          {creation.parentUsername ? (
            <Link
              href={`/members/${creation.parentUsername}`}
              className="font-semibold text-[#2d4737] hover:text-[#7b2430]"
            >
              Shared by {creation.parentName}
            </Link>
          ) : (
            <span>Shared by {creation.parentName}</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Encouraging reactions">
          {kidsReactionTypes.map((reactionType) => {
            const active = creation.viewerReactions.includes(reactionType);
            const count = creation.reactions[reactionType];

            return (
              <form action={toggleKidsReaction} key={reactionType}>
                <input type="hidden" name="creation_id" value={creation.id} />
                <input type="hidden" name="reaction_type" value={reactionType} />
                <button
                  type="submit"
                  aria-pressed={active}
                  className={`border px-3 py-2 text-xs font-bold transition-colors ${
                    active
                      ? "border-[#7b2430] bg-[#7b2430] text-[#f9f4eb]"
                      : "border-[#242721]/20 bg-[#fffdf8] text-[#2d4737] hover:border-[#7b2430] hover:text-[#7b2430]"
                  }`}
                >
                  {kidsReactionLabels[reactionType]}
                  {count > 0 ? ` ${count}` : ""}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export default async function KidsPage({ searchParams }: KidsPageProps) {
  const { user } = await requireActiveMembership("/kids");
  const params = await searchParams;
  const submitted = params.submitted === "1";
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const supabase = await createClient();
  const [creations, myCreations] = await Promise.all([
    getPublishedKidsCreations(supabase, user.id),
    getKidsCreationsForParent(supabase, user.id),
  ]);

  return (
    <main className="bg-[#edf1f0] py-12 sm:py-16">
      <PageContainer>
        <div className="mx-auto max-w-6xl">
          <header className="grid overflow-hidden border border-[#242721]/20 bg-[#f6efe2] lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">
                Pony Kids Club
              </p>
              <h1 className="mt-4 max-w-3xl font-serif text-5xl tracking-[-0.05em] text-[#242721] sm:text-6xl">
                The Pony Pages.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#56584f]">
                Stories, drawings, poems, comics, pony wisdom, and show memories from the next generation at the rail.
              </p>
              <a
                href="#submit"
                className="mt-7 inline-flex border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] hover:border-[#7b2430] hover:bg-[#7b2430]"
              >
                Submit something wonderful
              </a>
            </div>
            <aside className="border-t border-[#242721]/15 bg-[#2d4737] p-7 text-[#f9f4eb] lg:border-l lg:border-t-0 sm:p-9">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#d8bd85]">
                Grown-ups at the gate
              </p>
              <h2 className="mt-3 font-serif text-3xl">A parent-managed space.</h2>
              <p className="mt-4 text-sm leading-7 text-[#e4e1d8]">
                Adults submit every piece. Use only a first name or nickname and a broad age group. Never include school names, barn addresses, phone numbers, travel plans, daily schedules, or a child’s full legal name.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#e4e1d8]">
                Every submission waits for review before members can see it. There are no comments or private messages here, only encouraging reactions.
              </p>
            </aside>
          </header>

          {submitted ? (
            <p role="status" className="mt-6 border border-[#2d4737]/35 bg-[#e5eee7] px-4 py-3 text-sm leading-6 text-[#2d4737]">
              It is safely in the review basket. You will see it here after an administrator approves it.
            </p>
          ) : null}
          {rawError ? (
            <p role="alert" className="mt-6 border border-[#7b2430]/40 bg-[#f1dedd] px-4 py-3 text-sm leading-6 text-[#7b2430]">
              {rawError}
            </p>
          ) : null}

          <section className="mt-10" aria-labelledby="pony-pages-gallery-title">
            <div className="flex flex-col gap-3 border-b border-[#242721]/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Fresh from the tack trunk</p>
                <h2 id="pony-pages-gallery-title" className="mt-2 font-serif text-4xl tracking-[-0.035em] text-[#242721]">
                  Made by pony kids.
                </h2>
              </div>
              <p className="text-sm font-semibold text-[#686a61]">
                {creations.length} {creations.length === 1 ? "creation" : "creations"}
              </p>
            </div>
            {creations.length ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {creations.map((creation) => (
                  <CreationCard key={creation.id} creation={creation} />
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  eyebrow="The first blank page"
                  title="Nothing has been pinned up yet."
                  description="The first approved story or drawing gets the ceremonial top spot in the tack trunk."
                />
              </div>
            )}
          </section>

          <section id="submit" className="mt-14 scroll-mt-24 border border-[#242721]/20 bg-[#f9f5ed]">
            <div className="border-b border-[#242721]/15 bg-[#e7e1d5] p-6 sm:p-8">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Parent submission desk</p>
              <h2 className="mt-2 font-serif text-4xl tracking-[-0.035em] text-[#242721]">Pin up their proudest page.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#56584f]">
                Stories can be typed below. Drawings and comics can be photographed or scanned. A piece may include both words and an image.
              </p>
            </div>
            <form action={submitKidsCreation} encType="multipart/form-data" className="p-6 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className={labelClassName}>
                  Child’s first name or nickname
                  <input name="child_display_name" required maxLength={40} placeholder="Jackson" className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  Broad age group
                  <select name="child_age_group" required defaultValue="not-shared" className={inputClassName}>
                    {kidsAgeGroups.map((ageGroup) => (
                      <option key={ageGroup} value={ageGroup}>{kidsAgeGroupLabels[ageGroup]}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClassName}>
                  What kind of creation is it?
                  <select name="category" required defaultValue="drawing" className={inputClassName}>
                    {kidsCreationCategories.map((category) => (
                      <option key={category} value={category}>{kidsCategoryLabels[category]}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClassName}>
                  Title
                  <input name="title" required maxLength={160} placeholder="The Pony Who Would Not Trot" className={inputClassName} />
                </label>
              </div>

              <label className={`mt-6 block ${labelClassName}`}>
                Their words
                <textarea
                  name="body"
                  maxLength={8000}
                  rows={10}
                  placeholder="Type the story, poem, pony tip, comic caption, or show memory here."
                  className={inputClassName}
                />
                <span className="mt-1.5 block text-xs font-normal leading-5 text-[#686a61]">Leave this blank when the artwork tells the whole story.</span>
              </label>

              <fieldset className="mt-6 border border-[#242721]/20 bg-[#fffdf8] p-5">
                <legend className="px-2 text-sm font-semibold text-[#2d4737]">Drawing, comic, or artwork image</legend>
                <input
                  type="file"
                  name="artwork"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-[#56584f] file:mr-4 file:border file:border-[#2d4737] file:bg-[#2d4737] file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-[#f9f4eb] hover:file:bg-[#7b2430]"
                />
                <p className="mt-2 text-xs leading-5 text-[#686a61]">JPG, PNG, or WebP. Maximum 6 MB. Crop out school names, ribbons with identifying information, addresses, and unrelated people.</p>
                <label className={`mt-5 block ${labelClassName}`}>
                  Describe the image for people who cannot see it
                  <input name="image_alt_text" maxLength={300} placeholder="A crayon drawing of a gray pony jumping a flower box." className={inputClassName} />
                </label>
              </fieldset>

              <label className="mt-6 flex items-start gap-3 border border-[#b08d57]/50 bg-[#f8f0dc] p-5">
                <input type="checkbox" name="guardian_attested" required className="mt-1 size-4 accent-[#7b2430]" />
                <span>
                  <span className="block text-sm font-bold text-[#62543a]">I am the parent or legal guardian, or I have that guardian’s permission.</span>
                  <span className="mt-1 block text-sm leading-6 text-[#6b6049]">I reviewed this submission and confirmed that it contains no full legal name, school, exact address, phone number, email, schedule, travel plan, or other private identifying information.</span>
                </span>
              </label>

              <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#242721]/15 pt-6">
                <button type="submit" className="border border-[#2d4737] bg-[#2d4737] px-5 py-3 text-sm font-bold text-[#f9f4eb] hover:border-[#7b2430] hover:bg-[#7b2430]">
                  Send to the review basket
                </button>
                <p className="max-w-xl text-xs leading-5 text-[#686a61]">Submitting does not publish immediately. An administrator must approve it first.</p>
              </div>
            </form>
          </section>

          <section className="mt-12" aria-labelledby="my-kids-submissions-title">
            <div className="border-b border-[#242721]/20 pb-4">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">My review basket</p>
              <h2 id="my-kids-submissions-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">Pieces I submitted.</h2>
            </div>
            {myCreations.length ? (
              <div className="mt-5 divide-y divide-[#242721]/15 border border-[#242721]/20 bg-[#f9f5ed]">
                {myCreations.map((creation) => (
                  <article key={creation.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[#7b2430]">{statusLabel(creation.moderation_status)} · {kidsCategoryLabels[creation.category]}</p>
                      <h3 className="mt-2 font-serif text-2xl text-[#242721]">{creation.title}</h3>
                      <p className="mt-1 text-sm text-[#686a61]">By {creation.child_display_name} · submitted {formatDate(creation.created_at)}</p>
                    </div>
                    {creation.moderation_status === "pending" ? (
                      <form action={deletePendingKidsCreation}>
                        <input type="hidden" name="creation_id" value={creation.id} />
                        <button type="submit" className="text-sm font-bold text-[#7b2430] underline underline-offset-4">Withdraw pending submission</button>
                      </form>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 border border-dashed border-[#2d4737]/40 bg-[#edf1f0] p-5 text-sm leading-6 text-[#56584f]">Nothing in your basket yet.</p>
            )}
          </section>
        </div>
      </PageContainer>
    </main>
  );
}

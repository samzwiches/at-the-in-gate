import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/auth/require-user";
import { getJobsForOwner } from "@/lib/supabase/jobs";
import { getListingsForOwner, formatListingType } from "@/lib/supabase/listings";
import { getMembershipForProfileSafely } from "@/lib/membership/membership";

const actions = [
  { label: "Open community", description: "Step into the member spaces at the rail.", href: "/community" },
  { label: "Membership", description: "Review community access and billing status.", href: "/membership" },
  { label: "Create listing", description: "Add a horse, pony, or piece of tack for review.", href: "/marketplace/new" },
  { label: "My listings", description: "See every listing you have submitted and its status.", href: "/marketplace/my-listings" },
  { label: "Post a job", description: "Share a barn role with the people who know the work.", href: "/jobs/new" },
  { label: "Directory listings", description: "Add or manage the professional and service details in your book.", href: "/directory/mine" },
  { label: "My services", description: "Keep the specific services attached to your directory identity current.", href: "/services/mine" },
  { label: "My shipping routes", description: "Update the routes attached to your shipper listing.", href: "/shippers/mine" },
  { label: "My reviews", description: "Review the notes you have submitted for moderation.", href: "/reviews/mine" },
  { label: "Shop items", description: "Keep your approved external seller links current.", href: "/shop/mine" },
];

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const [listings, jobs, membershipLookup] = await Promise.all([
    getListingsForOwner(user.id),
    getJobsForOwner(user.id),
    getMembershipForProfileSafely(user.id),
  ]);
  const { membership, warning: membershipWarning } = membershipLookup;
  const daybookActions = membership.isAdmin
    ? [...actions, { label: "Admin desk", description: "Review the staff-side in-gate preview.", href: "/admin" }]
    : actions;

  return (
    <main className="bg-[#eef1ed] py-12 sm:py-16">
      <PageContainer>
        <header className="flex flex-col gap-5 border-b border-[#242721]/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">{membership.isAdmin ? "Administrator daybook" : "Member dashboard"}</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">Your daybook.</h1><p className="mt-4 text-lg leading-8 text-[#56584f]">Your active postings, current account routes, and a direct path back to the places you use.</p></div>
          <Link href="/membership" className="border border-[#2d4737] bg-[#f9f5ed] px-4 py-3 text-sm font-bold text-[#2d4737] transition-colors hover:bg-[#e7e1d5]">Manage membership <span aria-hidden="true">↗</span></Link>
        </header>

        {membershipWarning ? <p role="status" className="mt-6 border border-[#b08d57]/45 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">{membershipWarning}</p> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_0.75fr]">
          <div className="space-y-6">
            <section className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-6"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Useful next moves</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.025em] text-[#242721]">A few good places to start.</h2><div className="mt-5 grid border-l border-t border-[#242721]/20 sm:grid-cols-2">{daybookActions.map((action) => <Link key={action.href} href={action.href} className="group min-h-40 border-b border-r border-[#242721]/20 bg-[#f9f5ed] p-4 transition-colors hover:bg-[#fffaf1]" aria-label={action.label}><div className="flex items-start justify-between gap-3"><h3 className="font-serif text-xl text-[#242721]">{action.label}</h3><span className="text-lg text-[#2d4737] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true">↗</span></div><p className="mt-4 text-sm leading-6 text-[#56584f]">{action.description}</p></Link>)}</div></section>

            <section className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-6"><div className="flex items-end justify-between gap-4 border-b border-[#242721]/15 pb-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Your marketplace listings</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.025em] text-[#242721]">The ones in your book.</h2></div><Link href="/marketplace/my-listings" className="text-sm font-bold text-[#2d4737] hover:text-[#7b2430]">View all</Link></div>{listings.length === 0 ? <div className="mt-5"><EmptyState eyebrow="No listings submitted" title="Put a good one on the board." description="Create a listing when you are ready; drafts and submissions remain visible here." action={<Link href="/marketplace/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] hover:text-[#7b2430]">Create listing</Link>} /></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{listings.slice(0, 4).map((listing) => <Link key={listing.id} href={`/marketplace/${listing.slug}`} className="group border border-[#242721]/15 p-4 transition-colors hover:bg-[#fffaf1]"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#7b2430]">{formatListingType(listing.listing_type)} · {listing.status}</p><h3 className="mt-2 flex items-center justify-between gap-3 font-serif text-2xl text-[#242721]"><span>{listing.horse_name}</span><span className="text-lg text-[#2d4737] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true">↗</span></h3><p className="mt-1 text-sm text-[#56584f]">{listing.location} · {listing.price_text}</p></Link>)}</div>}</section>
          </div>

          <aside className="space-y-6">
            <section className="border border-[#242721]/20 bg-[#dce4e4] p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Your job postings</p><h2 className="mt-3 font-serif text-3xl text-[#242721]">Roles on your board.</h2></div><Link href="/jobs/mine" className="text-sm font-bold text-[#2d4737] hover:text-[#7b2430]">View all</Link></div>{jobs.length === 0 ? <div className="mt-5"><EmptyState eyebrow="No job postings" title="Know a barn looking?" description="Post the role with its location and practical details for review." action={<Link href="/jobs/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] hover:text-[#7b2430]">Post a job</Link>} /></div> : <div className="mt-5 space-y-3">{jobs.slice(0, 3).map((job) => <Link key={job.id} href={`/jobs/${job.slug}`} className="group block border-t border-[#242721]/15 pt-4 transition-colors hover:text-[#7b2430]"><p className="text-sm font-bold text-[#2d4737]">{job.title}</p><p className="mt-1 text-xs text-[#686a61]">{job.employer} · {job.moderation_status}</p></Link>)}</div>}</section>
            <section className="border border-[#242721]/20 bg-[#f9f5ed] p-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Community access</p><h2 className="mt-3 font-serif text-3xl text-[#242721]">Meet at the rail.</h2><p className="mt-3 text-sm leading-6 text-[#56584f]">Membership keeps the community spaces focused on the people who are part of the conversation.</p><Link href="/community" className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Open community</Link></section>
          </aside>
        </div>
      </PageContainer>
    </main>
  );
}

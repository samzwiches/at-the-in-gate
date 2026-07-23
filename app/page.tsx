import Link from "next/link";
import Button from "@/components/ui/Button";
import SectionBackground from "@/components/site-media/SectionBackground";
import SiteMedia from "@/components/site-media/SiteMedia";
import { localImageExists } from "@/components/ui/LocalImage";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/events/EventCard";
import JobCard from "@/components/jobs/JobCard";
import ListingCard from "@/components/marketplace/ListingCard";
import { communitySpaces, editorialImages } from "@/lib/placeholder-data";
import { siteMediaOverlayStyle } from "@/lib/site-media";
import { getPublishedEvents } from "@/lib/supabase/events";
import { getPublishedJobs } from "@/lib/supabase/jobs";
import { getPublishedListings } from "@/lib/supabase/listings";
import { getSiteMedia } from "@/lib/supabase/site-media";

type QuickLink = {
  number: string;
  title: string;
  description: string;
  href: string;
  tone: string;
};

const quickLinks: QuickLink[] = [
  { number: "01", title: "Marketplace", description: "Horses, ponies, tack, and the next right fit.", href: "/marketplace", tone: "bg-[#dce3df]" },
  { number: "02", title: "Community", description: "The notes, questions, and opinions between the rings.", href: "/community", tone: "bg-[#e5d9d0]" },
  { number: "03", title: "Shows", description: "Find approved dates and add the ones worth knowing.", href: "/events", tone: "bg-[#dbe3e4]" },
  { number: "04", title: "Directory", description: "A place for the people and programs the horse world relies on.", href: "/directory", tone: "bg-[#e7e1d5]" },
  { number: "05", title: "Jobs", description: "Barn roles, show help, and career moves worth making.", href: "/jobs", tone: "bg-[#dce0d5]" },
  { number: "06", title: "Shop", description: "Ring-side resources and useful finds, carefully edited.", href: "/shop", tone: "bg-[#e9ddcf]" },
];

const featuredCommunitySpaces = communitySpaces.slice(0, 3);

function Arrow({ className = "" }: { className?: string }) {
  return <span className={`text-xl leading-none ${className}`}>↗</span>;
}

export default async function Home() {
  const [listings, events, jobs, homeHeroMedia] = await Promise.all([
    getPublishedListings(),
    getPublishedEvents(),
    getPublishedJobs(),
    getSiteMedia("home.hero"),
  ]);
  const featuredListings = listings.slice(0, 3);
  const featuredEvents = events.slice(0, 3);
  const featuredJobs = jobs.slice(0, 3);
  const hasHeroImage = localImageExists(editorialImages.morningAtTheInGate.imageSrc);
  const heroFallback = hasHeroImage ? {
    src: editorialImages.morningAtTheInGate.imageSrc,
    alt: editorialImages.morningAtTheInGate.imageAlt,
    focalX: 50,
    focalY: 42,
    overlayTone: "brand" as const,
    overlayOpacity: 0.55,
  } : null;
  const heroOverlayTone = homeHeroMedia?.overlay_tone ?? heroFallback?.overlayTone ?? "none";
  const heroOverlayOpacity = homeHeroMedia?.overlay_opacity ?? heroFallback?.overlayOpacity ?? 0;

  return (
    <main className="overflow-x-hidden bg-[#f4efe5] font-sans text-[#242721]">
      <section className="border-b border-[#242721]/20 bg-[#f4efe5]">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-[#7b2430]">Horse people, in the know</p>
            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.045em] text-[#22251f] sm:text-6xl lg:text-7xl xl:text-8xl">The hunter-jumper world, all in one place.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4f514a] sm:text-xl">Horses, ponies, professionals, horse shows, jobs, and the conversations happening between the rings.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/marketplace" className="w-full px-6 py-3.5 sm:w-auto">Browse listings <Arrow /></Button>
              <Button href="/community" variant="secondary" className="w-full px-6 py-3.5 sm:w-auto">Join community <Arrow /></Button>
            </div>
            <p className="mt-14 border-t border-[#242721]/20 pt-5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#686a61]">Marketplace · Events · Community</p>
          </div>

          <div className="relative min-h-[440px] border-t border-[#242721]/20 bg-[#d9e0de] p-5 sm:p-8 lg:min-h-0 lg:border-l lg:border-t-0 lg:p-12">
            <div className="absolute inset-0 m-5 border border-[#2d4737]/25 sm:m-8 lg:m-12" aria-hidden="true" />
            <div className="relative flex h-full min-h-[400px] flex-col justify-between bg-[#355343] p-6 text-[#f9f4eb] sm:p-8">
              <SiteMedia mediaKey="home.hero" fallback={heroFallback} fallbackFocalPositionClassName="object-[50%_28%] lg:object-[50%_50%]" sizes="(max-width: 1023px) 100vw, 42vw" loading="eager" className="object-cover opacity-70" />
              {(homeHeroMedia || heroFallback) && heroOverlayTone !== "none" && heroOverlayOpacity > 0 ? <div className="absolute inset-0" style={siteMediaOverlayStyle(heroOverlayTone, heroOverlayOpacity)} aria-hidden="true" /> : null}
              <div className="relative flex items-start justify-between"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#d8bd85]">At the in gate</p><span className="border border-[#d8bd85]/60 px-2 py-1 text-[0.6rem] font-bold tracking-[0.15em] text-[#d8bd85]">FIELD NOTES</span></div>
              <div className="relative max-w-sm"><p className="font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">Where the good rounds lead.</p><p className="mt-5 max-w-xs text-sm leading-6 text-[#e8e3d7]">A better way to keep up with the listings, people, and showgrounds shaping the season—without the endless group-chat scroll.</p></div>
              <div className="relative grid grid-cols-[1fr_auto] gap-4 border-t border-[#f9f4eb]/25 pt-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#d8bd85]">From the in gate</p><p className="text-right text-xs text-[#f9f4eb]">Hunter · Jumper · Eq · Pony</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eee8dd] px-5 py-14 sm:px-8 sm:py-18 lg:px-12 lg:py-22">
        <div className="mx-auto max-w-[1344px]">
          <div className="mb-7 flex items-baseline justify-between border-b border-[#242721]/20 pb-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">Start here</p><p className="hidden text-xs text-[#686a61] sm:block">A better kind of horse-world rabbit hole.</p></div>
          <div className="grid border-l border-t border-[#242721]/20 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => <Link key={item.href} href={item.href} className={`group min-h-52 border-b border-r border-[#242721]/20 p-5 transition-colors hover:bg-[#f8f4ec] ${item.tone}`}><div className="flex items-start justify-between"><span className="text-[0.6875rem] font-bold tracking-[0.16em] text-[#7b2430]">{item.number}</span><Arrow className="text-[#2d4737] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div><div className="mt-11"><h2 className="font-serif text-2xl tracking-[-0.02em] text-[#242721]">{item.title}</h2><p className="mt-2 max-w-xs text-sm leading-5 text-[#56584f]">{item.description}</p></div></Link>)}
          </div>
        </div>
      </section>

      {featuredListings.length > 0 && <section className="px-5 py-16 sm:px-8 sm:py-22 lg:px-12 lg:py-28"><div className="mx-auto max-w-[1344px]"><SectionHeading eyebrow="The market board" title="A few good ones to know about." description="Thoughtful listings for the next chapter—not a black hole of blurry screenshots." action={{ label: "See all listings", href: "/marketplace" }} /><div className="grid gap-5 md:grid-cols-3">{featuredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></div></section>}

      <SectionBackground mediaKey="home.community_background" className="border-y border-[#242721]/20 bg-[#dce4e4] px-5 py-16 sm:px-8 sm:py-22 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1344px]">
          <SectionHeading eyebrow="From the rail" title="The conversations people actually have." description="Smart questions, small victories, field notes, and just enough light gossip." action={{ label: "Visit community", href: "/community" }} />
          <div className="grid border-l border-t border-[#242721]/20 lg:grid-cols-3">
            {featuredCommunitySpaces.map((space, index) => <Link href={`/community/${space.slug}`} key={space.slug} className="group flex min-h-68 flex-col justify-between border-b border-r border-[#242721]/20 bg-[#edf1f0] p-5 transition-colors hover:bg-[#f9f5ed] sm:p-6" aria-label={`Open the ${space.title} community space`}><div><div className="flex items-start justify-between gap-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#7b2430]">Community space</p><span className="font-serif text-3xl leading-none text-[#2d4737]/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">0{index + 1} ↗</span></div><h3 className="mt-9 font-serif text-2xl leading-tight tracking-[-0.025em] text-[#242721]">{space.title}</h3><p className="mt-5 max-w-sm text-sm leading-6 text-[#5e625b]">{space.description}</p></div><div className="mt-8 flex items-center justify-between border-t border-[#242721]/15 pt-4 text-xs text-[#5e625b]"><span>Members only</span><span>Open space</span></div></Link>)}
          </div>
        </div>
      </SectionBackground>

      {featuredEvents.length > 0 && <section className="px-5 py-16 sm:px-8 sm:py-22 lg:px-12 lg:py-28"><div className="mx-auto max-w-[1344px]"><SectionHeading eyebrow="The show circuit" title="Put it on the calendar." description="Approved show dates, destinations, and the weekends worth planning around." action={{ label: "Explore events", href: "/events" }} /><div className="grid gap-5 md:grid-cols-3">{featuredEvents.map((event) => <EventCard key={event.id} event={event} />)}</div></div></section>}

      {featuredJobs.length > 0 && <section className="bg-[#e8dfd3] px-5 py-16 sm:px-8 sm:py-22 lg:px-12 lg:py-28"><div className="mx-auto max-w-[1344px]"><SectionHeading eyebrow="Barn calls" title="The next good job might be in your orbit." description="Clear roles, serious programs, and fewer mysterious Facebook comments." action={{ label: "See all jobs", href: "/jobs" }} /><div className="grid gap-5 md:grid-cols-3">{featuredJobs.map((job) => <JobCard key={job.id} job={job} />)}</div></div></section>}

      <section className="bg-[#7b2430] px-5 py-16 text-[#f9f4eb] sm:px-8 sm:py-22 lg:px-12 lg:py-28"><div className="mx-auto flex max-w-[1344px] flex-col justify-between gap-9 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#e4c996]">Your spot at the rail</p><h2 className="mt-5 font-serif text-5xl leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">The best horse-world intel has always been shared. Let&apos;s give it a proper home.</h2></div><Link href="/membership" className="inline-flex shrink-0 items-center justify-center gap-3 border border-[#f9f4eb]/70 bg-[#f9f4eb] px-6 py-3.5 text-sm font-bold text-[#7b2430] transition-colors hover:bg-[#e4c996]">Join At The In Gate <Arrow /></Link></div></section>
    </main>
  );
}

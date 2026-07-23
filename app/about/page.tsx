import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import SectionHeading from "@/components/ui/SectionHeading";

const values = [
  ["Useful over noisy", "Information should help a person make a better next decision, not simply make more noise."],
  ["Community with standards", "Warm, opinionated, and candid is welcome. Mean, murky, and unhelpful is not."],
  ["For the whole horse world", "Riders, parents, trainers, grooms, shippers, barns, and the people who make the show happen."],
];

export default function AboutPage() {
  return (
    <main className="bg-[#f4efe5] py-12 sm:py-16"><PageContainer>
      <PageHero mediaKey="about.hero"><div className="grid gap-10 border-b border-[#242721]/20 pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[#7b2430]">About At The In Gate</p><h1 className="mt-4 max-w-4xl font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl lg:text-7xl">The horse world already has a front row. We&apos;re making it easier to find.</h1></div><p className="text-lg leading-8 text-[#56584f]">At The In Gate is a community-first home for hunter, jumper, equitation, and pony people—a better place to find opportunities, share knowledge, and feel more connected to the world around the ring.</p></div></PageHero>
      <section className="grid gap-8 py-14 lg:grid-cols-[0.75fr_1.25fr]"><div className="border border-[#b08d57] bg-[#e8dfd3] p-6 sm:p-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Why this exists</p><p className="mt-8 font-serif text-4xl leading-[0.98] tracking-[-0.04em] text-[#2d4737]">The best horse-world information has always traveled person to person.</p></div><div className="border-l border-t border-[#242721]/20"><div className="border-b border-r border-[#242721]/20 bg-[#f9f5ed] p-6 sm:p-8"><p className="text-sm leading-7 text-[#50554d]">You know the feeling: a promising pony is buried in a Facebook thread, a great job travels by text chain, a smart recommendation gets lost by Monday, and the show calendar is somehow still a puzzle. We are building the place that gathers those useful signals without sanding off the culture that makes horse people feel at home.</p><p className="mt-6 font-serif text-2xl tracking-[-0.025em] text-[#242721]">Half show book, half group-chat wisdom, fully on your side.</p></div></div></section>
      <section className="pb-14"><SectionHeading eyebrow="The difference" title="Built around a real community, not a generic classifieds model." /><div className="grid border-l border-t border-[#242721]/20 md:grid-cols-3">{values.map(([title, description], index) => <article key={title} className="border-b border-r border-[#242721]/20 bg-[#e6ece9] p-6"><span className="font-serif text-4xl text-[#7b2430]">0{index + 1}</span><h2 className="mt-9 font-serif text-2xl tracking-[-0.025em] text-[#242721]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#56584f]">{description}</p></article>)}</div></section>
    </PageContainer></main>
  );
}

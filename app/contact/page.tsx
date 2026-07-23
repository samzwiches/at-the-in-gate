import ContactForm from "@/components/contact/ContactForm";
import PageContainer from "@/components/layout/PageContainer";
import PageHero from "@/components/site-media/PageHero";
import PageCanvas from "@/components/site-media/PageCanvas";

export default function ContactPage() {
  return <PageCanvas appearanceKey="contact.page" tone="cream" className="py-12 sm:py-16"><PageContainer><div className="mx-auto max-w-4xl"><PageHero mediaKey="contact.hero"><header className="border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[color:var(--section-eyebrow-color,#7b2430)]">Contact</p><h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] text-[color:var(--section-heading-color,#242721)] sm:text-6xl">Send a proper note.</h1><p className="section-appearance-body-font mt-5 max-w-2xl text-lg leading-8 text-[color:var(--section-body-color,#56584f)]">Questions, feedback, listing help, and partnership ideas all have a place here.</p></header></PageHero><ContactForm /></div></PageContainer></PageCanvas>;
}

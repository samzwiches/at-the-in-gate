import Link from "next/link";
import { notFound } from "next/navigation";
import ServiceOfferingCard from "@/components/services/ServiceOfferingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryNav from "@/components/ui/CategoryNav";
import EmptyState from "@/components/ui/EmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { getPublishedServiceOfferings } from "@/lib/supabase/services";
import { serviceCategories } from "@/lib/taxonomy";

export default async function ServiceCategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = serviceCategories.find((item) => item.slug === categorySlug);
  if (!category) notFound();
  const services = await getPublishedServiceOfferings(category.slug);
  const items = [{ label: "All services", href: "/services" }, ...serviceCategories.map((item) => ({ label: item.label, href: `/services/category/${item.slug}` }))];
  return <main className="bg-[#e8dfd3] py-12 sm:py-16"><PageContainer><Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: category.label }]} /><header className="mt-8 border-b border-[#242721]/20 pb-8"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Service category</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.045em] text-[#242721] sm:text-6xl">{category.label}.</h1></header><div className="mt-6"><CategoryNav ariaLabel="Service categories" items={items} activeHref={`/services/category/${category.slug}`} /></div>{services.length > 0 ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => <ServiceOfferingCard key={service.id} service={service} />)}</div> : <div className="mt-10"><EmptyState eyebrow="No matching services" title={`No approved ${category.label.toLowerCase()} offerings are posted.`} description="Providers can add services once their directory identity has been approved." action={<Link href="/services/new" className="inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737]">Add a service</Link>} /></div>}</PageContainer></main>;
}

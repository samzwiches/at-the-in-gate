import Link from "next/link";
import LocalImage, { localImageExists } from "@/components/ui/LocalImage";
import { getTaxonomyItem, serviceCategories } from "@/lib/taxonomy";
import type { ServiceOfferingCard as ServiceOfferingCardType } from "@/lib/supabase/services";

export default function ServiceOfferingCard({ service, directoryName }: { service: ServiceOfferingCardType; directoryName?: string }) {
  const category = getTaxonomyItem(serviceCategories, service.category);
  const hasImage = localImageExists(service.image_path ?? undefined);
  return <article className="border border-[#242721]/20 bg-[#f9f5ed]">{hasImage ? <div className="relative aspect-[3/2] overflow-hidden bg-[#dce4e4]"><LocalImage src={service.image_path ?? undefined} alt="" sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw" /><span className="absolute inset-0 bg-[#2d4737]/10" aria-hidden="true" /></div> : null}<div className="p-5 sm:p-6"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7b2430]">{category?.label ?? service.category}</p><h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#242721]"><Link href={`/services/${service.slug}`} className="transition-colors hover:text-[#7b2430]">{service.title}</Link></h2>{directoryName ? <p className="mt-2 text-sm font-semibold text-[#2d4737]">{directoryName}</p> : null}<p className="mt-4 line-clamp-3 text-sm leading-6 text-[#56584f]">{service.description}</p>{service.service_area ? <p className="mt-5 border-t border-[#242721]/15 pt-4 text-xs text-[#686a61]">{service.service_area}</p> : null}<Link href={`/services/${service.slug}`} className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">View service</Link></div></article>;
}

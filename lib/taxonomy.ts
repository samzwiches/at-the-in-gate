export type TaxonomyItem = {
  slug: string;
  label: string;
};

export const eventCircuits: TaxonomyItem[] = [
  { slug: "northeast", label: "Northeast" },
  { slug: "southeast", label: "Southeast" },
  { slug: "kentucky", label: "Kentucky" },
  { slug: "midwest", label: "Midwest" },
  { slug: "championships", label: "Championships" },
];

export const jobCategories: TaxonomyItem[] = [
  { slug: "grooms", label: "Grooms" },
  { slug: "training-and-riding", label: "Training and riding" },
  { slug: "barn-management", label: "Barn management" },
  { slug: "show-help", label: "Show help" },
  { slug: "working-students", label: "Working students" },
];

export const listingCategories: TaxonomyItem[] = [
  { slug: "horses-and-ponies", label: "Horses and ponies" },
  { slug: "tack-and-equipment", label: "Tack and equipment" },
  { slug: "barn-and-show-gear", label: "Barn and show gear" },
];

export const listingTypes: TaxonomyItem[] = [
  { slug: "for-sale", label: "For sale" },
  { slug: "lease", label: "Lease" },
  { slug: "sale-or-lease", label: "Sale or lease" },
];

export const directoryCategories: TaxonomyItem[] = [
  { slug: "trainers", label: "Trainers" },
  { slug: "barns", label: "Barns" },
  { slug: "shippers", label: "Shippers" },
  { slug: "photographers", label: "Photographers" },
  { slug: "veterinarians", label: "Veterinarians" },
];

export const serviceCategories: TaxonomyItem[] = [
  { slug: "training-and-riding", label: "Training and riding" },
  { slug: "boarding-and-barn", label: "Boarding and barn" },
  { slug: "shipping-and-transportation", label: "Shipping and transportation" },
  { slug: "photography-and-media", label: "Photography and media" },
  { slug: "veterinary-and-wellness", label: "Veterinary and wellness" },
  { slug: "show-services", label: "Show services" },
  { slug: "insurance-and-finance", label: "Insurance and finance" },
  { slug: "other", label: "Other" },
];

export const shopCategories: TaxonomyItem[] = [
  { slug: "resources", label: "Resources" },
  { slug: "tack-and-equipment", label: "Tack and equipment" },
  { slug: "barn-and-show-gear", label: "Barn and show gear" },
  { slug: "apparel-and-accessories", label: "Apparel and accessories" },
];

export function getTaxonomyItem(items: TaxonomyItem[], slug: string) {
  return items.find((item) => item.slug === slug) ?? null;
}

export function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}

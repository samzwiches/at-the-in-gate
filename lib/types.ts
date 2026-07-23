export type NavigationItem = {
  label: string;
  href: string;
};

export type LocalImageAsset = {
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: string;
};

export type MarketplaceListing = LocalImageAsset & {
  slug: string;
  name: string;
  details: string;
  division: string;
  location: string;
  price: string;
  tone: string;
  mark: string;
  status: string;
};

export type CommunitySpace = {
  slug: string;
  title: string;
  description: string;
  tone: string;
};

export type ShowEvent = LocalImageAsset & {
  date: string;
  month: string;
  title: string;
  location: string;
  detail: string;
  circuit: string;
};

export type Professional = LocalImageAsset & {
  role: string;
  name: string;
  description: string;
  location: string;
  tone: string;
  specialty: string;
};

export type IndustryJob = {
  slug: string;
  role: string;
  company: string;
  location: string;
  type: string;
  summary: string;
};

export type Product = LocalImageAsset & {
  name: string;
  category: string;
  price: string;
  tone: string;
  mark: string;
  description: string;
};

export type EditorialImage = Required<LocalImageAsset>;

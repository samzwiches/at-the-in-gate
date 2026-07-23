import type {
  CommunitySpace,
  NavigationItem,
  EditorialImage,
} from "@/lib/types";

export const siteNavigation: NavigationItem[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Community", href: "/community" },
  { label: "Shows", href: "/events" },
  { label: "Directory", href: "/directory" },
  { label: "Services", href: "/services" },
  { label: "Shippers", href: "/shippers" },
  { label: "Jobs", href: "/jobs" },
  { label: "Shop", href: "/shop" },
];

export const communitySpaces: CommunitySpace[] = [
  {
    slug: "barn-aisle",
    title: "Barn Aisle",
    description: "The practical notes, small wins, and daily things that keep a barn moving.",
    tone: "bg-[#e6ece9]",
  },
  {
    slug: "hunter-and-equitation",
    title: "Hunter and Equitation",
    description: "Rounds, lessons, divisions, and the quiet details that make the picture work.",
    tone: "bg-[#e7e1d5]",
  },
  {
    slug: "pony-parents",
    title: "Pony Parents",
    description: "Packing lists, pep talks, growth spurts, and the pony-ring logistics nobody warns you about.",
    tone: "bg-[#dce4e4]",
  },
  {
    slug: "buying-selling-and-leasing",
    title: "Buying, Selling and Leasing",
    description: "Thoughtful perspective for the searches, trials, and hard-to-name feelings in between.",
    tone: "bg-[#e8dfd3]",
  },
  {
    slug: "horse-show-help",
    title: "Horse Show Help",
    description: "The useful answers for show weeks, from braids to hotel rooms to one more pair of hands.",
    tone: "bg-[#e6ece9]",
  },
  {
    slug: "shipping-and-transportation",
    title: "Shipping and Transportation",
    description: "Travel planning, shipper questions, and helping horses arrive ready to settle in.",
    tone: "bg-[#e7e1d5]",
  },
  {
    slug: "barn-life",
    title: "Barn Life",
    description: "The people, routines, and tiny systems that make a good barn feel like a good barn.",
    tone: "bg-[#dce4e4]",
  },
  {
    slug: "jobs-and-working-students",
    title: "Jobs and Working Students",
    description: "Career questions, work-life reality, and opportunities around the ring.",
    tone: "bg-[#e8dfd3]",
  },
  {
    slug: "off-topic",
    title: "Off Topic",
    description: "The ride-home thoughts and horse-person side conversations that do not fit anywhere else.",
    tone: "bg-[#e6ece9]",
  },
];

export const editorialImages: Record<"morningAtTheInGate" | "ponyFinalsBraids", EditorialImage> = {
  morningAtTheInGate: {
    imageSrc: "/images/listings/copperfield-braided-pony.jpg",
    imageAlt: "Champion pony and rider returning from a hunter ring",
    imagePosition: "50% 42%",
  },
  ponyFinalsBraids: {
    imageSrc: "/images/editorial/pony-finals-braids.jpg",
    imageAlt: "Close detail of pony braids and a pinned show number",
    imagePosition: "50% 42%",
  },
};

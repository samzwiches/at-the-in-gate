import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function TermsPage() {
  return <PlaceholderPage
    eyebrow="Terms of use"
    title="Community standards deserve a clear home."
    description="The rules for using the marketplace and community are being written to be practical, fair, and legible to real horse people."
    planned="This page will cover community participation, marketplace responsibilities, acceptable use, and the standards behind a useful and welcoming place."
    links={[{ label: "Privacy", href: "/privacy", variant: "secondary" }]}
  />;
}

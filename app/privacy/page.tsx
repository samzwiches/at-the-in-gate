import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function PrivacyPage() {
  return <PlaceholderPage
    eyebrow="Privacy"
    title="The plain-language privacy policy is being prepared."
    description="Member accounts, community conversations, and future marketplace activity deserve clear rules—not a mystery page in six-point type."
    planned="This page will explain what information At The In Gate collects, why it is used, how it is protected, and which choices members have."
    links={[{ label: "Terms of use", href: "/terms", variant: "secondary" }]}
  />;
}

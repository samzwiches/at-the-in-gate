import type { Metadata } from "next";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import PageCanvas from "@/components/site-media/PageCanvas";

export const metadata: Metadata = {
  title: "Terms of Use | At The In Gate",
  description: "Terms governing membership, community participation, listings, directories, jobs, and other use of At The In Gate.",
};

const effectiveDate = "July 27, 2026";

export default function TermsPage() {
  return (
    <PageCanvas tone="cream" className="py-14 sm:py-20">
      <PageContainer>
        <article className="mx-auto max-w-4xl text-[#2c221e]">
          <header className="border-b border-[#2c221e]/20 pb-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#935148]">Terms of use</p>
            <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] sm:text-6xl">The ground rules at the rail.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4a5342]">
              These Terms explain the rules for using At The In Gate, including its memberships, community spaces, marketplace, directory, job board, reviews, and related services.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#4a5342]">Effective {effectiveDate}</p>
          </header>

          <div className="legal-copy mt-10 space-y-10 text-base leading-8 text-[#2c221e]">
            <section>
              <h2>1. Who we are and acceptance of these Terms</h2>
              <p>
                At The In Gate is an equestrian community and information platform operated by Samantics LLC. In these Terms, “At The In Gate,” “we,” “us,” and “our” refer to the platform and its operator. By visiting the site, creating an account, purchasing a membership, posting content, submitting a listing, or otherwise using the services, you agree to these Terms and our <Link href="/privacy">Privacy Policy</Link>.
              </p>
              <p>If you do not agree, do not use the services.</p>
            </section>

            <section>
              <h2>2. Eligibility and accounts</h2>
              <p>
                You must be at least 13 years old to create or use an account. Anyone under 18 may use the services only with the permission and supervision of a parent or legal guardian. You must be at least 18, or have a parent or guardian act for you, to purchase a membership, enter a transaction, submit a paid listing, hire someone, accept work, or make any legally binding commitment through the platform.
              </p>
              <p>
                You are responsible for the accuracy of your account information, for activity under your account, and for keeping your sign-in credentials secure. Tell us promptly through the <Link href="/contact">contact page</Link> if you believe your account has been compromised.
              </p>
            </section>

            <section>
              <h2>3. Memberships, billing, cancellation, and refunds</h2>
              <p>
                Paid memberships provide the features shown at checkout or on the Membership page. Prices, billing intervals, and included features may change for future billing periods. We will provide notice of a material change when reasonably required.
              </p>
              <p>
                Memberships renew automatically at the interval displayed during checkout unless canceled before the next renewal date. You may manage or cancel an active membership through the account or billing portal. Cancellation stops future renewal charges but does not ordinarily create a prorated refund for the current billing period, except where required by law or expressly stated at purchase.
              </p>
              <p>
                Payment processing is handled by Stripe or another disclosed payment provider. We do not store complete payment-card numbers on our own servers. You authorize the payment provider to charge the payment method you select for applicable fees, renewals, taxes, and authorized purchases.
              </p>
            </section>

            <section>
              <h2>4. At The In Gate is a platform, not a party to member transactions</h2>
              <p>
                We provide tools that help people discover listings, services, shippers, jobs, events, reviews, and one another. Unless we expressly say otherwise, At The In Gate is not the seller, buyer, lessor, lessee, trainer, employer, employee, shipper, agent, broker, veterinarian, insurer, show manager, or contracting party in a transaction between users.
              </p>
              <p>
                We do not guarantee the identity, authority, qualifications, licensing, insurance, soundness, suitability, health, temperament, condition, legality, accuracy, availability, price, or performance of any person, horse, pony, service, job, shipment, item, venue, or listing. Publication, membership, moderation, or an “approved” status does not constitute our endorsement or warranty.
              </p>
            </section>

            <section>
              <h2>5. Marketplace and equestrian safety</h2>
              <p>
                Horse-related decisions carry meaningful financial and physical risk. Users are responsible for conducting their own due diligence before relying on a listing or entering an agreement. Appropriate diligence may include identity and ownership verification, references, written contracts, independent veterinary examinations, drug testing, trial terms, professional inspections, transportation arrangements, insurance, licensing checks, and consultation with qualified legal, tax, veterinary, training, or financial professionals.
              </p>
              <p>
                Never send money, release a horse, accept a shipment, disclose sensitive information, or sign an agreement solely because a person or listing appears on At The In Gate. Report suspected fraud, unsafe conduct, misrepresentation, stolen property, animal mistreatment, or prohibited activity through the <Link href="/contact">contact page</Link>.
              </p>
            </section>

            <section>
              <h2>6. Listings, directory entries, jobs, reviews, and other submissions</h2>
              <p>You promise that anything you submit is accurate to the best of your knowledge, lawful, current, and not misleading. You must have the rights and authority necessary to post it.</p>
              <p>Listings and posts may not:</p>
              <ul>
                <li>misrepresent ownership, identity, qualifications, condition, price, location, results, availability, or material facts;</li>
                <li>contain stolen photographs, copyrighted material, private information, or another person’s likeness without permission;</li>
                <li>promote fraud, unlawful discrimination, animal cruelty, unsafe conduct, prohibited goods, or illegal services;</li>
                <li>use bait-and-switch pricing, hidden mandatory charges, fabricated testimonials, or manipulated records;</li>
                <li>impersonate another person, business, barn, organization, show, or governing body;</li>
                <li>contain malware, scraping tools, spam, repetitive promotion, or attempts to bypass platform safeguards.</li>
              </ul>
              <p>
                Job posters are responsible for complying with wage, classification, workplace-safety, nondiscrimination, immigration, tax, and employment laws. Applicants and workers are responsible for evaluating opportunities and employers. Directory providers and shippers are responsible for maintaining any licenses, registrations, insurance, permits, and professional qualifications their work requires.
              </p>
            </section>

            <section>
              <h2>7. Community standards</h2>
              <p>
                The community may be opinionated. It may not be abusive. Treat other people as real humans standing in the same barn aisle.
              </p>
              <p>Do not post or engage in:</p>
              <ul>
                <li>harassment, threats, stalking, intimidation, hate speech, or targeted humiliation;</li>
                <li>doxxing or sharing private contact, financial, medical, location, or identifying information without permission;</li>
                <li>sexual exploitation, grooming, or inappropriate contact with minors;</li>
                <li>graphic cruelty, encouragement of dangerous conduct, or instructions intended to harm people or animals;</li>
                <li>fraud, scams, undisclosed conflicts of interest, coordinated manipulation, or fake accounts;</li>
                <li>spam, mass solicitation, or commercial promotion outside areas intended for it;</li>
                <li>content that violates another person’s intellectual-property, privacy, publicity, or contractual rights.</li>
              </ul>
              <p>
                Criticism and firsthand reviews must remain truthful, relevant, and based on genuine experience. Disagreement is allowed. Retaliation, fabricated claims, and campaigns of harassment are not.
              </p>
            </section>

            <section>
              <h2>8. Your content and our permission to display it</h2>
              <p>
                You retain ownership of content you create. By submitting content, you give At The In Gate a nonexclusive, worldwide, royalty-free license to host, store, reproduce, format, resize, display, distribute, and promote that content as reasonably necessary to operate, improve, moderate, and market the services. This permission lasts while the content is on the platform and for reasonable backup, archival, legal, and operational periods afterward.
              </p>
              <p>
                You may remove content through available account tools or request assistance. Removal may not erase content already shared by others, retained for legal or security reasons, included in transaction records, or preserved in routine backups for a limited period.
              </p>
            </section>

            <section>
              <h2>9. Moderation and enforcement</h2>
              <p>
                We may review, refuse, edit for formatting, restrict, hide, remove, or preserve content when we reasonably believe it violates these Terms, creates risk, is misleading, infringes rights, disrupts the service, or is otherwise inappropriate for the platform. We may warn, limit, suspend, or terminate accounts and may cooperate with lawful investigations.
              </p>
              <p>
                We are not required to monitor every submission, resolve every private dispute, or publish every listing. Moderation decisions may involve judgment and may not satisfy every participant.
              </p>
            </section>

            <section>
              <h2>10. Intellectual property</h2>
              <p>
                The site’s original design, software, text, branding, logos, organization, and platform-created materials belong to At The In Gate, Samantics LLC, or their licensors and are protected by applicable law. You may use the services for their intended personal or business purposes, but you may not copy, scrape, resell, reverse engineer, frame, mirror, or create a competing database from the services without written permission.
              </p>
              <p>
                To report claimed copyright or trademark infringement, use the <Link href="/contact">contact page</Link> and include enough detail for us to identify the work, the challenged material, your authority, and how to reach you.
              </p>
            </section>

            <section>
              <h2>11. Third-party services and links</h2>
              <p>
                The services may rely on or link to third parties, including authentication, hosting, database, analytics, payment, mapping, email, and social platforms. Those services have their own terms and privacy practices. We are not responsible for third-party sites, services, content, outages, or transactions.
              </p>
            </section>

            <section>
              <h2>12. Service changes and availability</h2>
              <p>
                We may add, change, suspend, or discontinue features; set reasonable usage limits; correct errors; or perform maintenance. We do not promise uninterrupted, error-free, or permanently available service. We may change these Terms by posting an updated version and changing the effective date. Material changes may also be communicated through the site or account contact information.
              </p>
            </section>

            <section>
              <h2>13. Disclaimers</h2>
              <p>
                The services and all user-provided content are provided “as is” and “as available.” To the fullest extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular purpose, title, noninfringement, accuracy, quiet enjoyment, and any warranty arising from course of dealing or usage of trade.
              </p>
              <p>
                Content on At The In Gate is general information and community discussion. It is not veterinary, medical, legal, tax, insurance, employment, financial, safety, training, transportation, or other professional advice. Always use qualified professionals and independent judgment.
              </p>
            </section>

            <section>
              <h2>14. Limitation of liability</h2>
              <p>
                To the fullest extent permitted by law, At The In Gate, Samantics LLC, and their owners, contractors, affiliates, and service providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages; lost profits, revenue, data, goodwill, or opportunities; personal injury, property damage, animal injury or loss; or losses arising from user conduct, listings, transactions, transportation, employment, services, events, or third-party systems.
              </p>
              <p>
                To the fullest extent permitted by law, our total liability for a claim arising from the services will not exceed the greater of the amount you paid directly to At The In Gate during the twelve months before the event giving rise to the claim or $100. Some jurisdictions do not allow certain exclusions or limits, so portions of this section may not apply to you.
              </p>
            </section>

            <section>
              <h2>15. Indemnification</h2>
              <p>
                To the extent permitted by law, you agree to defend, indemnify, and hold harmless At The In Gate, Samantics LLC, and their owners, contractors, affiliates, and service providers from claims, losses, liabilities, damages, judgments, and reasonable costs arising from your content, conduct, transaction, violation of these Terms, or infringement of another person’s rights.
              </p>
            </section>

            <section>
              <h2>16. Termination</h2>
              <p>
                You may stop using the services at any time. We may suspend or terminate access when reasonably necessary to protect users, animals, the platform, third parties, or legal compliance. Provisions that by their nature should survive termination will survive, including ownership, licenses already granted, transaction responsibilities, disclaimers, liability limits, indemnification, and dispute provisions.
              </p>
            </section>

            <section>
              <h2>17. Governing law and disputes</h2>
              <p>
                These Terms are governed by the laws of the Commonwealth of Kentucky, without regard to conflict-of-law rules. Before filing a formal claim, please contact us and give us a reasonable opportunity to resolve the issue informally. Unless applicable law requires otherwise, disputes must be brought in the state or federal courts serving Kenton County, Kentucky, and the parties consent to that venue and jurisdiction.
              </p>
            </section>

            <section>
              <h2>18. General provisions</h2>
              <p>
                These Terms and the Privacy Policy form the agreement between you and us concerning the services. If a provision is unenforceable, it will be limited or removed only to the minimum extent necessary, and the remainder will continue. Our failure to enforce a provision is not a waiver. You may not transfer your rights or obligations without our consent. We may assign the agreement as part of a reorganization, financing, merger, sale, or transfer of the platform or business.
              </p>
            </section>

            <section>
              <h2>19. Contact</h2>
              <p>
                Questions, reports, rights requests, and legal notices may be submitted through our <Link href="/contact">contact page</Link>. Please include enough information for us to understand and respond to the request.
              </p>
            </section>
          </div>

          <footer className="mt-12 border-t border-[#2c221e]/20 pt-6 text-sm text-[#4a5342]">
            <p>Plain language matters, but legal terms still carry legal consequences. Consider obtaining independent legal advice before relying on these Terms for a specific dispute.</p>
          </footer>
        </article>
      </PageContainer>
    </PageCanvas>
  );
}

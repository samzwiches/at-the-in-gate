import type { Metadata } from "next";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import PageCanvas from "@/components/site-media/PageCanvas";

export const metadata: Metadata = {
  title: "Privacy Policy | At The In Gate",
  description: "How At The In Gate collects, uses, shares, and protects personal information.",
};

const effectiveDate = "July 27, 2026";

export default function PrivacyPage() {
  return (
    <PageCanvas tone="cream" className="py-14 sm:py-20">
      <PageContainer>
        <article className="mx-auto max-w-4xl text-[#2c221e]">
          <header className="border-b border-[#2c221e]/20 pb-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[#935148]">Privacy policy</p>
            <h1 className="section-appearance-heading-font mt-4 text-5xl tracking-[-0.045em] sm:text-6xl">Your information, in plain sight.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4a5342]">
              This policy explains what At The In Gate collects, why we use it, when it may be shared, and the choices available to members and visitors.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#4a5342]">Effective {effectiveDate}</p>
          </header>

          <div className="legal-copy mt-10 space-y-10 text-base leading-8 text-[#2c221e]">
            <section>
              <h2>1. Who controls your information</h2>
              <p>
                At The In Gate is operated by Samantics LLC. In this policy, “At The In Gate,” “we,” “us,” and “our” refer to the platform and its operator. This policy applies to the website, accounts, memberships, community spaces, marketplace, directory, job board, reviews, events, forms, and related services that link to it.
              </p>
            </section>

            <section>
              <h2>2. Information we collect</h2>
              <p>Depending on how you use the services, we may collect the following categories of information.</p>

              <h3>Account and profile information</h3>
              <p>
                This may include your name, email address, profile details, display name, photograph, barn or business information, location, role, and information received from a sign-in provider such as Google. We do not receive your Google password.
              </p>

              <h3>Membership and transaction information</h3>
              <p>
                This may include membership status, plan, billing interval, transaction identifiers, payment status, limited billing details, refunds, cancellations, and communications about purchases. Payment providers such as Stripe process payment-card information under their own privacy practices. We do not store complete payment-card numbers on our own servers.
              </p>

              <h3>Content you submit</h3>
              <p>
                This may include listings, photographs, captions, community posts, comments, reviews, directory entries, job postings, event details, messages sent through forms, reports, and other material you choose to provide. Content submitted to public or member-facing areas may be visible to other people.
              </p>

              <h3>Technical and usage information</h3>
              <p>
                We and our service providers may automatically receive device and browser information, IP address, approximate location derived from IP, timestamps, referring pages, pages viewed, clicks, session and authentication data, error logs, security events, and cookie or similar identifier information needed to operate, secure, measure, and improve the services.
              </p>

              <h3>Communications</h3>
              <p>
                We may keep the contents of messages, support requests, reports, feedback, and other communications, together with contact information and related records.
              </p>
            </section>

            <section>
              <h2>3. How we use information</h2>
              <p>We may use information to:</p>
              <ul>
                <li>create and manage accounts, profiles, memberships, and billing;</li>
                <li>publish and operate listings, directory entries, jobs, reviews, community spaces, and events;</li>
                <li>authenticate users and remember sessions and preferences;</li>
                <li>process transactions, renewals, refunds, cancellations, and account requests;</li>
                <li>moderate content, investigate reports, enforce our Terms, and protect users, animals, and the platform;</li>
                <li>detect fraud, abuse, unauthorized access, malware, and other security threats;</li>
                <li>respond to questions, provide support, and send service-related notices;</li>
                <li>send newsletters or promotional messages where permitted and provide a way to opt out;</li>
                <li>analyze site performance, understand feature use, fix errors, and improve the services;</li>
                <li>comply with law, legal process, tax, accounting, recordkeeping, and legitimate business obligations;</li>
                <li>protect, exercise, or defend legal rights.</li>
              </ul>
            </section>

            <section>
              <h2>4. Cookies and similar technologies</h2>
              <p>
                The services may use cookies, local storage, session tokens, and similar technologies to keep you signed in, protect accounts, remember settings, route traffic, measure performance, and prevent fraud. Some are necessary for the site to function. Browser settings may allow you to block or delete cookies, but doing so may break sign-in, membership, and other features.
              </p>
            </section>

            <section>
              <h2>5. When we share information</h2>
              <p>We may share information in the following circumstances.</p>

              <h3>With other users and the public</h3>
              <p>
                Profile information, listings, photographs, posts, reviews, directory entries, job postings, and other content may be displayed to the audiences indicated by the feature. Information posted publicly can be copied, indexed, or reshared by others outside our control.
              </p>

              <h3>With service providers</h3>
              <p>
                We may provide information to companies that help us host, authenticate, store data, process payments, secure the services, send communications, monitor errors, provide analytics, or perform other operational work. Current or anticipated providers may include Cloudflare, Supabase, Google, Stripe, and other vendors used to run the platform. They may process information only as permitted by their agreements and applicable law.
              </p>

              <h3>For safety, rights, and legal reasons</h3>
              <p>
                We may preserve or disclose information when we reasonably believe it is necessary to comply with law or valid legal process; investigate fraud, abuse, threats, animal mistreatment, or illegal conduct; enforce our Terms; protect rights, safety, property, or the integrity of the services; or respond to an emergency.
              </p>

              <h3>In a business transfer</h3>
              <p>
                Information may be disclosed or transferred as part of a financing, reorganization, merger, acquisition, asset sale, bankruptcy, or transfer of all or part of the platform or business, subject to applicable legal protections.
              </p>

              <h3>With your direction or consent</h3>
              <p>We may share information when you ask us to, authorize an integration, or otherwise consent.</p>

              <p>
                At present, we do not sell personal information for money or use it for cross-context behavioral advertising. If that practice changes, we will update this policy and provide any choices required by law.
              </p>
            </section>

            <section>
              <h2>6. Email and communications choices</h2>
              <p>
                We may send transactional or relationship messages about accounts, memberships, listings, moderation, security, payments, and service changes. These messages are part of providing the services and may continue even if you opt out of marketing.
              </p>
              <p>
                Marketing messages will include an unsubscribe method where required. You may also contact us to request that promotional email stop. Unsubscribing from marketing does not cancel an account, membership, or transaction.
              </p>
            </section>

            <section>
              <h2>7. Data retention</h2>
              <p>
                We keep information for as long as reasonably necessary to provide the services, maintain accounts and transaction records, resolve disputes, enforce agreements, meet legal or accounting obligations, protect safety and security, and support legitimate business operations. Retention periods vary by data type and purpose.
              </p>
              <p>
                Deleted content or closed accounts may remain for a limited period in backups, logs, fraud-prevention records, legal holds, transaction records, or copies made by other users. We aim not to retain personal information longer than needed for a legitimate purpose.
              </p>
            </section>

            <section>
              <h2>8. Security</h2>
              <p>
                We use reasonable administrative, technical, and organizational safeguards intended to protect information. No website, database, transmission, or storage system can be guaranteed completely secure. You are responsible for protecting your account credentials and for using caution when posting personal or location information.
              </p>
            </section>

            <section>
              <h2>9. Your choices and requests</h2>
              <p>Depending on your location and applicable law, you may be able to:</p>
              <ul>
                <li>access, correct, or update account and profile information;</li>
                <li>delete certain content or request account deletion;</li>
                <li>request information about the personal information we maintain;</li>
                <li>ask us to correct or delete personal information;</li>
                <li>object to or restrict certain processing;</li>
                <li>receive a portable copy of certain information;</li>
                <li>withdraw consent where processing is based on consent;</li>
                <li>appeal a denied privacy request where applicable;</li>
                <li>opt out of marketing communications.</li>
              </ul>
              <p>
                Submit requests through the <Link href="/contact">contact page</Link>. We may need to verify your identity and authority before completing a request. We may deny or limit a request where permitted by law, including when information must be retained for security, fraud prevention, transactions, legal obligations, free-expression rights, or the rights of others.
              </p>
            </section>

            <section>
              <h2>10. Children and teenagers</h2>
              <p>
                At The In Gate is not directed to children under 13, and children under 13 may not create accounts or submit personal information. If we learn that we collected personal information from a child under 13 without appropriate authorization, we will take reasonable steps to delete it.
              </p>
              <p>
                Users ages 13 through 17 may use the services only with permission and supervision from a parent or legal guardian. A parent or guardian who believes a minor has submitted information improperly should contact us.
              </p>
            </section>

            <section>
              <h2>11. Third-party sites and services</h2>
              <p>
                The services may link to or interact with websites and tools we do not control. Their privacy practices are governed by their own policies. This policy does not cover information a user independently exchanges with a seller, buyer, employer, service provider, shipper, barn, show, or other third party outside our systems.
              </p>
            </section>

            <section>
              <h2>12. United States operations and international visitors</h2>
              <p>
                At The In Gate is operated from the United States. Information may be stored and processed in the United States and other locations where our service providers operate. Those locations may have privacy laws different from the laws where you live.
              </p>
            </section>

            <section>
              <h2>13. Changes to this policy</h2>
              <p>
                We may update this policy as the platform, service providers, or legal requirements change. The effective date at the top shows when the current version took effect. Material changes may also be announced through the site or account contact information where reasonably appropriate.
              </p>
            </section>

            <section>
              <h2>14. Contact</h2>
              <p>
                Privacy questions, account requests, parental concerns, and rights requests may be submitted through our <Link href="/contact">contact page</Link>. Please include enough detail for us to identify the account or information involved and respond appropriately.
              </p>
            </section>
          </div>

          <footer className="mt-12 border-t border-[#2c221e]/20 pt-6 text-sm text-[#4a5342]">
            <p>See the <Link href="/terms">Terms of Use</Link> for the rules governing accounts, memberships, listings, community participation, and transactions.</p>
          </footer>
        </article>
      </PageContainer>
    </PageCanvas>
  );
}

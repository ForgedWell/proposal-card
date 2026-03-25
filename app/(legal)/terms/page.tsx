import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — My Proposal Card",
  description: "Terms of Service for My Proposal Card",
};

export default function TermsPage() {
  const effectiveDate = "March 24, 2026";

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-sm text-brand-600 hover:underline">← My Proposal Card</a>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-10">Effective date: {effectiveDate}</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using My Proposal Card ("Service", "we", "us"), you agree to be bound
              by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. What My Proposal Card Does</h2>
            <p>
              My Proposal Card is a privacy-first contact sharing platform. Users create a personal
              card with a public URL and QR code. People who scan the card can submit a contact
              request. The card owner reviews and approves or declines each request. Approved
              connections may communicate via in-app messaging or private SMS using masked phone
              numbers so neither party's real number is exposed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years old to use this Service. By using My Proposal Card,
              you represent that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate information when creating your profile</li>
              <li>You may not impersonate another person or entity</li>
              <li>You are responsible for all activity that occurs under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to use My Proposal Card to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Harass, threaten, or harm other users</li>
              <li>Send spam, unsolicited messages, or bulk communications</li>
              <li>Impersonate any person or entity</li>
              <li>Violate any applicable law or regulation</li>
              <li>Attempt to circumvent the privacy protections built into the Service</li>
              <li>Use automated tools to scrape, crawl, or abuse the Service</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. SMS Communications</h2>
            <p>
              By participating in a private SMS connection via My Proposal Card, you consent to
              receive transactional SMS messages related to that connection. Message and data rates
              may apply. You may opt out at any time by replying <strong>STOP</strong> to any message.
              No marketing or promotional messages will be sent via SMS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Content</h2>
            <p>
              You retain ownership of content you post (profile information, messages). By posting
              content, you grant us a limited license to display and transmit it as necessary to
              operate the Service. You are solely responsible for content you post and its accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Privacy</h2>
            <p>
              Our{" "}
              <a href="/privacy-policy" className="text-brand-600 hover:underline">Privacy Policy</a>
              {" "}is incorporated into these Terms and describes how we collect and use your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Disclaimers</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee
              uninterrupted or error-free operation. We are not responsible for the content or conduct
              of other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, My Proposal Card shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of the
              Service, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the new Terms. We will update the effective date when changes
              are made.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Contact</h2>
            <p>
              Questions about these Terms? Contact us at:{" "}
              <a href="mailto:legal@myproposalcard.com" className="text-brand-600 hover:underline">
                legal@myproposalcard.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

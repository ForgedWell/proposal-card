import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — My Proposal Card",
  description: "Privacy Policy for My Proposal Card",
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "March 24, 2026";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myproposalcard.com";

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-sm text-brand-600 hover:underline">← My Proposal Card</a>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-10">Effective date: {effectiveDate}</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Overview</h2>
            <p>
              My Proposal Card ("we", "us", or "our") operates the website at {appUrl} (the "Service").
              This Privacy Policy explains how we collect, use, and protect your personal information
              when you use our Service. By using My Proposal Card, you agree to the practices described
              in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Email address</strong> — collected when you sign in via email OTP</li>
              <li><strong>Phone number</strong> — optionally provided in your profile for private SMS connections</li>
              <li><strong>Profile information</strong> — display name, bio, location, photo URL, and links you choose to share publicly on your card</li>
              <li><strong>Contact request data</strong> — name, contact information, and message submitted by people requesting to connect with you</li>
              <li><strong>Card scan data</strong> — IP address and user agent logged when your public card is visited via QR code</li>
              <li><strong>Messages</strong> — in-app messages exchanged between connected users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To authenticate you via email one-time password (OTP)</li>
              <li>To display your public profile card at your chosen URL</li>
              <li>To facilitate private connection requests and messaging between users</li>
              <li>To send SMS notifications via a masked phone number when a connection is approved</li>
              <li>To notify your designated guardian (Wali) of new connection requests, if you have enabled this feature</li>
              <li>To maintain session security and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. SMS Messaging</h2>
            <p>
              If you participate in a private SMS connection, your real phone number is never shared
              with the other party. All SMS messages are routed through a masked Twilio phone number.
              Message and data rates may apply. You can opt out of SMS at any time by replying
              <strong> STOP</strong> to any message. For help, reply <strong>HELP</strong>.
            </p>
            <p className="mt-2">
              By submitting a contact request form on this platform, you consent to receive
              transactional SMS messages related to your connection request. No marketing or
              promotional SMS messages will be sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Supabase</strong> — database hosting (PostgreSQL)</li>
              <li><strong>Twilio</strong> — SMS delivery and phone number masking</li>
              <li><strong>Resend</strong> — transactional email delivery (login codes, notifications)</li>
              <li><strong>Vercel</strong> — web hosting and serverless infrastructure</li>
            </ul>
            <p className="mt-2">All third-party providers are bound by their own privacy policies and data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>OTP codes expire after 10 minutes and are marked used upon verification</li>
              <li>Sessions expire after 7 days</li>
              <li>Proxy SMS connections expire after 72 hours</li>
              <li>You may delete your account and all associated data by contacting us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of SMS communications by replying STOP</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Security</h2>
            <p>
              We use industry-standard security measures including HTTPS encryption, httpOnly session
              cookies, and database-level session revocation. No method of transmission over the
              internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by updating the effective date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Contact</h2>
            <p>
              For privacy questions or data requests, contact us at:{" "}
              <a href="mailto:privacy@myproposalcard.com" className="text-brand-600 hover:underline">
                privacy@myproposalcard.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

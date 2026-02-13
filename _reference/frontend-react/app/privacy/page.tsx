'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold cosmic-text mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="glass-card p-8 space-y-6 text-white/90">
            <p className="text-sm text-white/70 mb-6">
              Last updated: January 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
              <p className="mb-4">
                Oalethia ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our StarManifest™ service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Personal Information</h3>
              <p className="mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Email address and account credentials</li>
                <li>Birth date, birth time, and location (for astrological calculations)</li>
                <li>Goals, outcomes, and context you provide for timeline generation</li>
                <li>Payment information (processed securely through Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Usage Information</h3>
              <p className="mb-4">
                We automatically collect certain information when you use our Service:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Usage patterns and interaction with the Service</li>
                <li>Error logs and performance data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Generate personalized astrological timelines and action plans</li>
                <li>Process transactions and manage subscriptions</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor and analyze usage patterns to improve user experience</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Storage and Security</h2>
              <p className="mb-4">
                Your data is stored securely using Supabase, a modern database platform with enterprise-grade security. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="mb-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Data Sharing and Disclosure</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> We may share data with third-party service providers who perform services on our behalf (e.g., payment processing, analytics, hosting)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Third-Party Services</h2>
              <p className="mb-4">
                Our Service integrates with third-party services:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li><strong>Stripe:</strong> For payment processing. Stripe's privacy policy governs their handling of payment information.</li>
                <li><strong>OpenAI:</strong> For AI-powered content generation. Data sent to OpenAI is subject to their privacy policy.</li>
                <li><strong>Sentry:</strong> For error tracking and monitoring to improve service reliability.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Your Rights and Choices</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>Withdraw consent at any time where processing is based on consent</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, please contact us through our support channels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. Children's Privacy</h2>
              <p className="mb-4">
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our Service, you consent to the transfer of your information to these countries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">11. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">12. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us through our support channels.
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="glass-button px-6 py-3 inline-block">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}


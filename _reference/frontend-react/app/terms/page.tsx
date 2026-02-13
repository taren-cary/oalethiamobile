'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold cosmic-text mb-8 text-center">
            Terms of Service
          </h1>
          
          <div className="glass-card p-8 space-y-6 text-white/90">
            <p className="text-sm text-white/70 mb-6">
              Last updated: January 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using Oalethia StarManifest™ ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Description of Service</h2>
              <p className="mb-4">
                Oalethia StarManifest™ is an astro-manifestation application that provides personalized action plans and timelines aligned with astrological insights. The Service uses AI-powered generation to create customized action plans based on user-provided information including birth details, goals, and preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. User Accounts</h2>
              <p className="mb-4">
                To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Credits and Subscriptions</h2>
              <p className="mb-4">
                The Service operates on a credit-based system. Free users receive a limited number of credits per month. Premium subscriptions provide additional credits and features. Credits are non-transferable and expire according to the terms of your subscription plan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. User Content</h2>
              <p className="mb-4">
                You retain ownership of any content you submit to the Service. By submitting content, you grant Oalethia a license to use, store, and process your content solely for the purpose of providing the Service to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Prohibited Uses</h2>
              <p className="mb-4">
                You agree not to use the Service:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Disclaimer of Warranties</h2>
              <p className="mb-4">
                The Service is provided "as is" and "as available" without any warranties of any kind, either express or implied. Oalethia does not warrant that the Service will be uninterrupted, secure, or error-free. The astrological insights and action plans provided are for entertainment and personal development purposes only and should not be considered as professional advice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall Oalethia, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">11. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us through our support channels.
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


'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function RefundPolicy() {
  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold cosmic-text mb-8 text-center">
            Refund Policy
          </h1>
          
          <div className="glass-card p-8 space-y-6 text-white/90">
            <p className="text-sm text-white/70 mb-6">
              Last updated: January 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Overview</h2>
              <p className="mb-4">
                At Oalethia, we strive to provide you with the best possible experience with our StarManifest™ service. This Refund Policy outlines the terms and conditions under which refunds may be issued for subscriptions and credit purchases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Subscription Refunds</h2>
              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Monthly Subscriptions</h3>
              <p className="mb-4">
                Monthly subscriptions can be cancelled at any time, and you will continue to have access to Premium features until the end of your current billing period. Refunds for the current billing period are available within 7 days of the initial purchase or renewal, provided you have not used more than 50% of your monthly credit allocation.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Annual Subscriptions</h3>
              <p className="mb-4">
                Annual subscriptions can be cancelled at any time. If you cancel within 30 days of purchase or renewal, you will receive a full refund. After 30 days, refunds will be prorated based on the remaining time in your subscription period, minus any credits used during the subscription period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. Credit Purchases</h2>
              <p className="mb-4">
                Credits purchased separately (outside of subscriptions) are generally non-refundable once used. However, if you experience technical issues that prevent you from using purchased credits, please contact our support team within 14 days of purchase, and we will review your case on an individual basis.
              </p>
              <p className="mb-4">
                Unused credits from one-time purchases do not expire and remain in your account until used. Refunds for unused credits are not available unless required by law in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Free Credits</h2>
              <p className="mb-4">
                Free credits provided as part of account registration or promotional offers are non-refundable and cannot be exchanged for monetary value.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Refund Process</h2>
              <p className="mb-4">To request a refund:</p>
              <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
                <li>Contact our support team through the support channels provided in your account</li>
                <li>Provide your account email and the transaction details (subscription type, purchase date, amount)</li>
                <li>Explain the reason for your refund request</li>
              </ol>
              <p className="mb-4">
                Refund requests will be reviewed within 5-7 business days. Approved refunds will be processed to the original payment method within 10-14 business days, depending on your payment provider.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Non-Refundable Items</h2>
              <p className="mb-4">The following are non-refundable:</p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Credits that have been used to generate timelines</li>
                <li>Subscriptions after the refund period has expired</li>
                <li>Services that have been fully consumed or delivered</li>
                <li>Any fees charged by payment processors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Chargebacks</h2>
              <p className="mb-4">
                If you initiate a chargeback or dispute a charge with your payment provider, your account may be suspended pending resolution. We encourage you to contact us directly first to resolve any issues, as we are committed to finding a satisfactory solution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Service Issues</h2>
              <p className="mb-4">
                If you experience technical issues that prevent you from using the Service as intended, please contact our support team immediately. We will work to resolve the issue promptly. If the issue cannot be resolved and significantly impacts your ability to use the Service, we may offer a refund or credit extension at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. Changes to Refund Policy</h2>
              <p className="mb-4">
                We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes are posted constitutes acceptance of the modified policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. Contact Information</h2>
              <p className="mb-4">
                For refund requests or questions about this policy, please contact us through our support channels. We are committed to resolving any issues fairly and promptly.
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


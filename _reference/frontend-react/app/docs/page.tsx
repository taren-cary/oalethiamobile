'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function UserDocs() {
  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold cosmic-text mb-8 text-center">
            StarManifest™ Generator User Guide
          </h1>
          
          <div className="glass-card p-8 space-y-8 text-white/90">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">What is StarManifest™?</h2>
              <p className="mb-4">
                StarManifest™ is an AI-powered astro-manifestation tool that creates personalized action plans aligned with your birth chart. By analyzing your astrological profile and combining it with your goals, we generate a step-by-step timeline with specific actions timed to optimal cosmic moments.
              </p>
              <p className="mb-4">
                StarManifest™ is built on the foundation of <strong>Quantum Astrology</strong>, a framework that understands how consciousness interacts with quantum reality. Our app helps you navigate this quantum landscape by using affirmations to stabilize desired eigenstates (stable "you-states") and transit timing to choose optimal moments when the energetic cost of reaching your goals is lowest.
              </p>
              <p className="mb-4">
                <Link href="/quantum-astrology" className="text-blue-300 hover:text-blue-200 underline">
                  Learn more about Quantum Astrology →
                </Link>
              </p>
              <p className="mb-4">
                Each timeline includes:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Specific actions timed to astrologically significant dates (when energetic cost is low)</li>
                <li>Daily affirmations to stabilize your desired eigenstates</li>
                <li>Strategic guidance based on your birth chart and transits</li>
                <li>Resources and recommendations when available</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Getting Started</h2>
              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Step 1: Navigate to the Generator</h3>
              <p className="mb-4">
                Click on "StarManifest™ Generator" in the navigation menu or footer to access the timeline generator.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Step 2: Fill Out the Form</h3>
              <p className="mb-4">
                The generator requires several pieces of information to create your personalized timeline:
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Form Fields Explained</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">What do you want to achieve? (Required)</h3>
                  <p className="mb-2">
                    This is your main goal or outcome. Be specific and clear about what you want to manifest.
                  </p>
                  <p className="text-white/70 text-sm mb-2">
                    <strong>Examples:</strong>
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1 ml-4 text-white/70 text-sm">
                    <li>"Get promoted to Senior Manager"</li>
                    <li>"Find a life partner"</li>
                    <li>"Hit $10,000 per month in revenue"</li>
                    <li>"Complete a marathon"</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">What's your current situation? (Optional but Recommended)</h3>
                  <p className="mb-2">
                    Provide context about where you are now in relation to your goal. The more detail you provide, the more personalized your action plan will be.
                  </p>
                  <p className="text-white/70 text-sm mb-2">
                    <strong>Include:</strong> Your current status, relevant experience, challenges you're facing, and any relevant background information.
                  </p>
                  <p className="text-white/70 text-sm mb-4">
                    <strong>Example:</strong> "I'm a freelance graphic designer with 2 regular clients, making $3k/month, working from home, have 5 years experience but want to scale up"
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">What resources do you have available? (Optional)</h3>
                  <p className="mb-2">
                    Describe the resources you can leverage to achieve your goal. This helps the AI create realistic and actionable steps.
                  </p>
                  <p className="text-white/70 text-sm mb-2">
                    <strong>Include:</strong> Time availability, budget, network/contacts, skills, tools, or any other assets you have.
                  </p>
                  <p className="text-white/70 text-sm mb-4">
                    <strong>Example:</strong> "I have 3-4 hours per day available, budget of $200-300 for tools/courses, small professional network of about 20 contacts"
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Preferred Approach</h3>
                  <p className="mb-2">
                    Choose how you want to approach your goal:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                    <li><strong>Conservative:</strong> Steady, low-risk steps that build gradually</li>
                    <li><strong>Balanced:</strong> A mix of steady progress and bold moves (recommended for most users)</li>
                    <li><strong>Aggressive:</strong> Bold, high-impact actions for rapid progress</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Timeframe</h3>
                  <p className="mb-2">
                    Select how long you want your timeline to span:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                    <li><strong>1 Month:</strong> Short-term goals and quick wins</li>
                    <li><strong>3 Months:</strong> Available to all users, good for medium-term goals</li>
                    <li><strong>6 Months:</strong> Premium feature, ideal for significant life changes</li>
                    <li><strong>1 Year:</strong> Premium feature, for major long-term transformations</li>
                  </ul>
                  <p className="text-white/70 text-sm mb-4">
                    <strong>Note:</strong> Free users can access up to 3-month timelines. Premium subscriptions unlock 6-month and 1-year timelines.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Birth Information (Required)</h3>
                  <p className="mb-2">
                    Your birth details are essential for accurate astrological calculations:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                    <li><strong>Birth Date:</strong> Required - Your date of birth</li>
                    <li><strong>Birth Time:</strong> Optional but recommended - If you don't know your exact birth time, the system defaults to 12:00 PM. More accurate times provide more precise astrological insights.</li>
                    <li><strong>Birth Location:</strong> Required - The city and country where you were born. Start typing and select from the location suggestions that appear.</li>
                  </ul>
                  <p className="text-white/70 text-sm mb-4">
                    <strong>Tip:</strong> If you're a registered user, your birth information is saved to your profile and will auto-fill on future timeline generations.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Generating Your Timeline</h2>
              <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
                <li>Fill out all required fields (marked with *)</li>
                <li>Review your information to ensure accuracy</li>
                <li>Drag the submit slider to generate your timeline</li>
                <li>Wait while the AI calculates your birth chart, analyzes transits, and generates your personalized action plan (this typically takes 30-60 seconds)</li>
              </ol>
              <p className="mb-4 text-white/70 text-sm">
                <strong>Note:</strong> Each timeline generation uses 1 credit. Free users receive 3 credits per month. Premium users have unlimited timeline generations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Understanding Your Results</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Action Timeline</h3>
              <p className="mb-4">
                Your timeline consists of specific actions scheduled on dates that align with favorable astrological transits. These dates are chosen because the <strong>energetic cost</strong> of reaching your desired eigenstates is lowest during these windows, making it easier to take action and manifest your goals. Each action includes:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li><strong>Date:</strong> The optimal date to take this action based on astrological timing (when energetic cost is low)</li>
                <li><strong>Action:</strong> A specific, actionable step toward your goal</li>
                <li><strong>Transit:</strong> The astrological event that makes this timing favorable</li>
                <li><strong>Strategy:</strong> Additional guidance on how to approach the action</li>
                <li><strong>Resources:</strong> When available, links to helpful videos, articles, or tools</li>
              </ul>
              <p className="mb-4 text-white/70 text-sm">
                <strong>Tip:</strong> Completing actions earns you 10 points each. When you finish all actions in a timeline, you'll earn a 50-point bonus!
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Daily Affirmations</h3>
              <p className="mb-4">
                Each timeline includes daily affirmations to support your journey. These affirmations are designed to help you stabilize your desired eigenstates (the "you-states" you want to become). These affirmations:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Rotate daily to keep your motivation fresh</li>
                <li>Are aligned with your specific goal</li>
                <li>Can be marked as "affirmed" to track your daily practice</li>
                <li>Earn you 5 points each day you affirm them</li>
                <li>Help maintain focus and positive energy throughout your timeline</li>
                <li>Support the quantum alignment between your internal state and external reality</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Tracking Progress</h3>
              <p className="mb-4">
                You can track your progress by:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Marking actions as completed when you finish them (earns 10 points each)</li>
                <li>Skipping actions that don't apply to your situation</li>
                <li>Viewing your completion progress at the top of the timeline</li>
                <li>Affirming your daily affirmation to build consistency (earns 5 points per day)</li>
                <li>Checking your points and level in the navigation bar</li>
                <li>Viewing your achievement badges and progress toward the next level</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Saving Your Timeline</h2>
              <p className="mb-4">
                If you're a registered user, you can save your timeline to access it later:
              </p>
              <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
                <li>Review your generated timeline</li>
                <li>Click the "Save Timeline" button</li>
                <li>Access saved timelines from the "My Timelines" page</li>
              </ol>
              <p className="mb-4 text-white/70 text-sm">
                <strong>Note:</strong> Anonymous users can view timelines but cannot save them. Sign up for a free account to save your timelines and access them anytime.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Tips for Best Results</h2>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li><strong>Be Specific:</strong> The more detail you provide about your goal and situation, the more personalized your timeline will be</li>
                <li><strong>Be Honest:</strong> Accurate information about your current situation helps create realistic action steps</li>
                <li><strong>Use Accurate Birth Information:</strong> Precise birth date, time, and location improve astrological accuracy</li>
                <li><strong>Choose Appropriate Timeframes:</strong> Match your timeframe to the scope of your goal</li>
                <li><strong>Review Actions Regularly:</strong> Check your timeline regularly and mark actions as you complete them</li>
                <li><strong>Stay Flexible:</strong> While dates are optimized, you can adjust timing based on your circumstances</li>
                <li><strong>Practice Daily Affirmations:</strong> Consistent affirmation practice supports your manifestation journey</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Credits and Subscriptions</h2>
              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Free Users</h3>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>3 free credits per month (resets monthly)</li>
                <li>Access to 1-month and 3-month timelines</li>
                <li>Can save timelines (requires account)</li>
                <li>Access to points system and achievement levels</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Premium Users</h3>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Unlimited timeline generations</li>
                <li>Access to all timeframe options (1 month, 3 months, 6 months, 1 year)</li>
                <li>Priority support</li>
                <li>All free user features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Points System and Achievements</h2>
              <p className="mb-4">
                StarManifest™ includes a gamified points system that rewards you for taking action and building consistency. Earn points to level up and unlock achievement badges!
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-white mt-4">How to Earn Points</h3>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li><strong>Complete an Action:</strong> 10 points per action</li>
                <li><strong>Daily Affirmation:</strong> 5 points per day (one per timeline per day)</li>
                <li><strong>Finish a Timeline:</strong> 50 points when you complete all actions</li>
                <li><strong>First Timeline Generation:</strong> 25 points bonus</li>
                <li><strong>Daily Login:</strong> 5 points (once per day)</li>
                <li><strong>7-Day Streak:</strong> 25 bonus points</li>
                <li><strong>30-Day Streak:</strong> 100 bonus points</li>
                <li><strong>Action Milestones:</strong> 
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>10 actions completed: 30 points</li>
                    <li>50 actions completed: 100 points</li>
                    <li>100 actions completed: 250 points</li>
                  </ul>
                </li>
                <li><strong>Refer a Friend:</strong> 50 points per referral</li>
                <li><strong>Share on Social Media:</strong> 10 points per share</li>
                <li><strong>Provide Feedback:</strong> 15 points</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Achievement Levels</h3>
              <p className="mb-4">
                As you earn points, you'll level up through 12 achievement levels, each with a unique badge:
              </p>
              <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
                <li><strong>Initiate of the Compass</strong> - Start your journey (0 points)</li>
                <li><strong>Orbital Apprentice</strong> - 25 points</li>
                <li><strong>Bearer of Intent</strong> - 75 points</li>
                <li><strong>Awakened Navigator</strong> - 200 points</li>
                <li><strong>Celestial Adept</strong> - 500 points</li>
                <li><strong>Stellar Alchemist</strong> - 1,200 points</li>
                <li><strong>Master of Arrival</strong> - 2,500 points</li>
                <li><strong>Sage of the Void</strong> - 5,000 points</li>
                <li><strong>Solar Oracle</strong> - 10,000 points</li>
                <li><strong>Quantum Starseed</strong> - 20,000 points</li>
                <li><strong>Cosmic Admiral</strong> - 40,000 points</li>
                <li><strong>Eternal Sovereign</strong> - 75,000 points</li>
              </ol>
              <p className="mb-4 text-white/70 text-sm">
                <strong>Note:</strong> Points are based on your lifetime total. When you level up, you'll see a special level-up animation and unlock a new badge. Check the leaderboard to see how you rank among other users!
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Need Help?</h2>
              <p className="mb-4">
                If you have questions or encounter issues:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Check that all required fields are filled correctly</li>
                <li>Ensure your birth location is selected from the suggestions</li>
                <li>Verify you have sufficient credits (check your account status)</li>
                <li>Try refreshing the page if you encounter errors</li>
              </ul>
              <p className="mb-4">
                For additional support, please refer to our Terms of Service and Privacy Policy, or contact us through our support channels.
              </p>
            </section>
          </div>

          <div className="mt-8 text-center space-x-4">
            <Link href="/timeline" className="glass-button px-6 py-3 inline-block">
              Try StarManifest™ Generator
            </Link>
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


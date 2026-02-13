'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function QuantumAstrologyPage() {
  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold cosmic-text mb-4 text-center">
            Understanding Quantum Astrology
          </h1>
          <p className="text-white/80 text-center mb-12">
            How the Universe Works and How You Can Navigate It
          </p>
          
          <div className="glass-card p-8 md:p-12 space-y-10 text-white/90">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">The Foundation: One Unified Reality</h2>
              <p className="mb-4">
                At the deepest level, everything in the universe, including you, exists as part of a single, interconnected quantum system. Think of it like a vast ocean where every wave, every current, and every drop of water is connected. There's no separation between "you" and "the world around you". You're both part of the same ocean.
              </p>
              <p className="mb-4">
                This unified reality is <strong>probabilistic</strong>, meaning it contains all possible outcomes simultaneously, like a tree with infinite branches. Which branch becomes "real" depends on how the system resolves itself, a process called <strong>decoherence</strong>.
              </p>
            </section>

            {/* Conscious Systems */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">You as a Conscious Operator</h2>
              <p className="mb-4">
                You're not just a passive object floating in this quantum ocean. You're an active participant, a <strong>conscious operator</strong> that can influence which outcomes become real.
              </p>
              <p className="mb-4">
                Imagine you're a lighthouse keeper. The lighthouse (your consciousness) doesn't just observe the ocean. It actively shines a beam of light that reveals certain paths while leaving others in shadow. Your thoughts, intentions, emotions, and actions are like adjusting that beam, choosing which possibilities to illuminate and make real.
              </p>
              <p className="mb-4">
                This isn't mystical thinking. It aligns with how quantum mechanics actually works. Your consciousness functions as an operator that interacts with and shapes the quantum state around you.
              </p>
            </section>

            {/* Birth as Decoherence */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Birth: Your Quantum Starting Point</h2>
              <p className="mb-4">
                Before you were born, you existed as a <strong>superposition</strong>, all possible versions of your life existing simultaneously, like a deck of cards with infinite possibilities.
              </p>
              <p className="mb-4">
                At the moment of birth, something profound happened: a <strong>macroscopic decoherence event</strong>. This is when the infinite possibilities collapsed into one specific reality. You became:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Connected to a specific body and nervous system</li>
                <li>Located at a particular place and time</li>
                <li>Aligned with a specific celestial configuration (the planets' positions)</li>
              </ul>
              <p className="mb-4">
                Think of it like a seed that could have grown into any type of plant, but at birth, it became a specific tree: an oak, a maple, or a pine. The type of tree you became determines what's possible for you, but not what's inevitable.
              </p>
            </section>

            {/* Natal Chart as Operator */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Your Birth Chart: Your Quantum Blueprint</h2>
              <p className="mb-4">
                Your birth chart (natal chart) doesn't <em>cause</em> your personality or fate. Instead, it's a <strong>quantum operator</strong>, a mathematical representation of the specific quantum state that became "you" at birth.
              </p>
              <p className="mb-4">
                Think of it like a musical instrument. A violin and a piano can both play beautiful music, but they have different ranges, different sounds, and different capabilities. Your birth chart is like the type of instrument you are. It defines what's possible for you, but not what you must play.
              </p>
              <p className="mb-4">
                This <strong>Natal Operator</strong> determines:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Which life paths are accessible to you (like which notes your instrument can play)</li>
                <li>Which themes have high probability (like which melodies come naturally)</li>
                <li>How different areas of your life interact (like how different parts of a song harmonize)</li>
              </ul>
              <p className="mb-4">
                <strong>Important:</strong> An operator doesn't encode fixed outcomes. It encodes <em>distributions of possible outcomes</em>. You're not locked into a predetermined path; you have a range of possibilities that align with your nature.
              </p>
            </section>

            {/* Body as Hardware */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Your Body: The Hardware</h2>
              <p className="mb-4">
                Your natal operator isn't just abstract. It's embedded in your physical body. Your neural wiring, your temperament, your stress responses, and even your genetics all reflect this quantum blueprint.
              </p>
              <p className="mb-4">
                Think of your body as the hardware that runs the software of your quantum operator. A computer's hardware determines what software it can run and how well it runs it. Similarly, your body is the biological hardware that instantiates your quantum operator.
              </p>
              <p className="mb-4">
                This is why astrology feels so embodied and real. It's not just in your mind, it's in your cells, your nervous system, and your entire physical being.
              </p>
            </section>

            {/* Eigenstates */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Eigenstates: The "You" States You Can Become</h2>
              <p className="mb-4">
                An <strong>eigenstate</strong> is a stable, resolved configuration of both your internal state (how you think, feel, and expect) and your external world (your roles, relationships, and opportunities). They're like different "versions" of you that are fully aligned and stable.
              </p>
              <p className="mb-4">
                Examples of eigenstates include:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>"You as a CEO" (confident leader with leadership opportunities)</li>
                <li>"You as a student" (curious learner with learning opportunities)</li>
                <li>"You as a disciplined builder" (focused creator with creation opportunities)</li>
                <li>"You in chronic conflict" (defensive person with conflict situations)</li>
              </ul>
              <p className="mb-4">
                These aren't metaphors. They're actual macroscopic states of the quantum system that includes you. When you're in an eigenstate, your internal reality and external reality are perfectly aligned. You think like a CEO, feel like a CEO, and the world responds by giving you CEO opportunities.
              </p>
              <p className="mb-4">
                Your natal operator defines:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Which eigenstates are even possible for you</li>
                <li>The <strong>energetic cost</strong> of maintaining each one (some states require more energy to sustain)</li>
              </ul>
            </section>

            {/* Transits */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Transits: Time-Dependent Opportunities</h2>
              <p className="mb-4">
                As planets move through the sky, they create <strong>transits</strong>, time-varying influences that act on your fixed natal operator. Think of transits like weather patterns that change the conditions around you.
              </p>
              <p className="mb-4">
                Transits don't force events to happen. Instead, they:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li><strong>Modulate probability amplitudes</strong>: they change how likely certain outcomes are</li>
                <li><strong>Lower or raise the energetic cost</strong> of certain eigenstates, making some "you-states" easier or harder to reach</li>
                <li><strong>Change which transitions are easiest</strong>: like opening certain doors while others remain closed</li>
              </ul>
              <p className="mb-4">
                Imagine you want to climb a mountain. On some days, the weather is perfect: clear skies, gentle breeze, ideal conditions. On other days, it's stormy, windy, and dangerous. The mountain is always there (your goal), but the <strong>energetic cost</strong> of climbing it changes with the weather (transits).
              </p>
              <p className="mb-4">
                Transits change <strong>which collapses are favored</strong>, which outcomes are more likely to become real. When the energetic cost is low, it's much easier to reach certain eigenstates. When it's high, you might struggle or need to wait for better timing.
              </p>
            </section>

            {/* Momentary State */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Your Current Quantum State</h2>
              <p className="mb-4">
                At any moment, your lived reality is described by:
              </p>
              <div className="bg-white/10 border border-white/30 rounded-lg p-6 mb-4">
                <p className="font-semibold text-center">
                  Current State = Natal Operator + Transit Operators + Environmental Constraints
                </p>
              </div>
              <p className="mb-4">
                This creates a <strong>superposition</strong> of possible "you-states," each with different probabilities. Most people repeatedly collapse into habitual, high-entropy eigenstates (like "You in chronic conflict" or "You as someone who struggles") and mistake this for fate.
              </p>
              <p className="mb-4">
                But you're not stuck. You can consciously choose to stabilize different eigenstates, ones that align with your goals.
              </p>
            </section>

            {/* Conscious Selection */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Conscious Selection: How You Shape Reality</h2>
              <p className="mb-4">
                When you stabilize a coherent internal state (consistent emotion, aligned intention, sustained attention, and congruent action), you're performing a <strong>measurement</strong> on the global wavefunction.
              </p>
              <p className="mb-4">
                This is the key insight: <strong>your internal eigenstate and your external world eigenstate are the same state</strong>, just viewed from different perspectives. When you think, feel, and act like a CEO, the world responds by giving you CEO opportunities. The system collapses <em>with</em> you, not <em>for</em> you.
              </p>
              <p className="mb-4">
                This is why:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Events occur without direct causation (synchronicity)</li>
                <li>Opportunities arrive at the right time</li>
                <li>Coincidences cluster around your intentions</li>
              </ul>
              <p className="mb-4">
                The universe isn't conspiring to help you. You and the universe are the same system, and when you align your internal state, the external state aligns with it.
              </p>
            </section>

            {/* Constraints */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">The Constraints: Why This Isn't Magic</h2>
              <p className="mb-4">
                This framework has real constraints that keep it grounded in reality:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li><strong>You cannot observe eigenstates not supported by your operator</strong>: you can't become something completely outside your nature (a violin can't become a piano)</li>
                <li><strong>You cannot violate environmental boundary conditions</strong>: you still need to follow the laws of physics and reality</li>
                <li><strong>You cannot hold incoherent or contradictory measurements for long</strong>: if you think like a CEO but act like a victim, the state will collapse into one or the other</li>
              </ul>
              <p className="mb-4">
                But within your allowed space, <strong>coherence strongly biases outcomes</strong>. When you align your thoughts, feelings, and actions with a desired eigenstate, you dramatically increase the probability of that state becoming real.
              </p>
            </section>

            {/* How the App Works */}
            <section className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50 rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">How StarManifest™ Uses This Understanding</h2>
              <p className="mb-4">
                Our app helps you navigate this quantum reality in two powerful ways:
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-white">1. Affirmations: Stabilizing Your Desired Eigenstates</h3>
                  <p className="mb-4">
                    <strong>Affirmations</strong> are powerful tools for stabilizing coherent internal states. When you repeat an affirmation that aligns with your goal, you're actively choosing to be in a specific eigenstate, like "You as someone who achieves $10k/month" or "You as a confident leader."
                  </p>
                  <p className="mb-4">
                    Think of affirmations like tuning your instrument. Each day, you practice the "song" of your desired state. The more consistently you tune yourself to that frequency, the more stable that eigenstate becomes, and the more the external world aligns with it.
                  </p>
                  <p className="mb-4">
                    Our app provides daily affirmations specifically designed to help you achieve the eigenstates necessary for your goal. By practicing these affirmations consistently, you're performing conscious measurements that favor your desired outcomes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-white">2. Transit Timing: Choosing Optimal Opportunities</h3>
                  <p className="mb-4">
                    Remember how transits change the <strong>energetic cost</strong> of reaching certain eigenstates? Our app analyzes your birth chart and identifies the optimal times when the energetic cost is <em>lowest</em> for reaching your desired states.
                  </p>
                  <p className="mb-4">
                    It's like waiting for perfect weather to climb that mountain. When a favorable transit occurs, the energetic cost of reaching your goal eigenstate drops dramatically. Taking action during these windows is like sailing with the wind instead of against it.
                  </p>
                  <p className="mb-4">
                    Our AI analyzes your birth chart, calculates the transits for your chosen timeframe, and creates a step-by-step timeline of actions timed to these optimal cosmic moments. Each action is scheduled when the energetic cost is low, making it easier for you to reach and maintain the eigenstates necessary for your goal.
                  </p>
                  <p className="mb-4">
                    This isn't about waiting passively. It's about <strong>strategic timing</strong>. You still need to take action, but you're choosing the moments when your actions will have maximum impact and require minimum energy.
                  </p>
                </div>

                <div className="bg-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 text-white">The Combined Power</h3>
                  <p className="mb-4">
                    When you combine daily affirmations (stabilizing your desired eigenstate) with optimal transit timing (taking action when the energetic cost is low), you're working <em>with</em> the quantum nature of reality rather than against it.
                  </p>
                  <p className="mb-4">
                    You're not just wishing for your goals. You're <strong>navigating</strong> the quantum landscape with precision, choosing the right moments to act and the right states to embody. This is why manifestation isn't wishing. It's navigation.
                  </p>
                </div>
              </div>
            </section>

            {/* Practical Application */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Putting It Into Practice</h2>
              <p className="mb-4">
                Here's how to use this understanding in your daily life:
              </p>
              <ol className="list-decimal list-inside mb-4 space-y-4 ml-4">
                <li>
                  <strong>Identify your desired eigenstate:</strong> What version of yourself do you want to become? "You as a successful entrepreneur," "You as a loving partner," "You as a healthy person". Be specific.
                </li>
                <li>
                  <strong>Practice daily affirmations:</strong> Use the affirmations from your timeline to stabilize this eigenstate. Repeat them consistently, feeling the truth of them in your body.
                </li>
                <li>
                  <strong>Take action during optimal transits:</strong> Follow your timeline and take the scheduled actions when the energetic cost is low. Notice how much easier things feel during these windows.
                </li>
                <li>
                  <strong>Maintain coherence:</strong> Align your thoughts, feelings, and actions with your desired eigenstate. When they're all pointing in the same direction, the external world responds.
                </li>
                <li>
                  <strong>Trust the process:</strong> Remember that you're not forcing outcomes. You're navigating probabilities. Stay consistent, and the system will collapse in your favor.
                </li>
              </ol>
            </section>

            {/* Conclusion */}
            <section className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">The Bottom Line</h2>
              <p className="mb-4">
                Quantum Astrology isn't about predicting a fixed future or believing in mystical forces. It's about understanding that:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>You and the universe are part of the same quantum system</li>
                <li>You can consciously influence which outcomes become real</li>
                <li>Your birth chart defines your range of possibilities, not your fixed fate</li>
                <li>Transits create windows of opportunity when certain states are easier to reach</li>
                <li>Affirmations and strategic timing help you navigate this landscape effectively</li>
              </ul>
              <p className="mb-4">
                You have more power than you think, but you also have real constraints. Within your allowed space, coherence and timing are everything. Use them wisely, and you'll find yourself navigating reality with unprecedented precision.
              </p>
            </section>

          </div>

          <div className="mt-12 text-center space-x-4">
            <Link href="/timeline" className="glass-button px-8 py-4 font-semibold inline-block">
              Create Your Quantum Timeline
            </Link>
            <Link href="/" className="glass-button px-8 py-4 font-semibold inline-block">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}


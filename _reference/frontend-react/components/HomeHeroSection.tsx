'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HomeHeroSectionProps {
  user?: any;
}

export default function HomeHeroSection({ user }: HomeHeroSectionProps) {

  return (
    <section className="min-h-screen flex items-start md:items-center justify-center px-4 pt-28 md:pt-24 pb-16 relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* Mobile Background */}
        <Image
          src="/assets/home-hero-backgroundmobile.svg"
          alt="Cosmic background"
          fill
          className="object-cover md:hidden"
          priority
          loading="eager"
          sizes="100vw"
        />
        {/* Desktop Background */}
        <Image
          src="/assets/home-hero-background2.svg"
          alt="Cosmic background"
          fill
          className="object-cover hidden md:block"
          priority
          loading="eager"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-12 items-center relative z-10">
        {/* Left side - iPhone mockup */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative">
            <Image
              src="/assets/iphone-mockup.svg"
              alt="Oalethia App Preview"
              width={1300}
              height={1300}
              className="drop-shadow-2xl"
              priority
              loading="eager"
              sizes="(max-width: 768px) 0px, 650px"
            />
            {/* Coming Soon Badge */}
            <div className="absolute top-4 right-4 glass-card px-4 py-2 backdrop-blur-md">
              <p className="text-white text-sm font-semibold text-center">
                📱 Mobile App<br/>Coming Soon
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-6">
            <h1 className="text-7xl lg:text-7xl font-bold cosmic-text drop-shadow-2xl leading-tight">
              Reaching Your Goals Just Got A Lot Easier
            </h1>
            <p className="text-lg text-white/80 max-w-2xl">
            Become a master at navigating your reality and manifest your goals on autopilot with the help of AI and Quantum Astrology.
            </p>
          </div>
          {/* Mobile app coming soon notice - subtle */}
          {!user && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/60 text-sm text-center lg:text-left">
                📱 Mobile app coming soon • Use StarManifest™ on web now
              </p>
            </div>
          )}

          {/* Primary CTA for non-users */}
          {!user && (
            <div className="max-w-md mx-auto lg:mx-0 space-y-4">
              <Link
                href="/timeline"
                className="glass-button px-8 py-4 text-xl font-semibold hover:bg-white/30 transition-all inline-block w-full text-center"
              >
                Start Using StarManifest™
              </Link>
              <p className="text-white/70 text-sm text-center">
                Plot a course to manifest your goals in a few easy steps — free to try
              </p>
            </div>
          )}


          {/* For logged in users */}
          {user && (
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="glass-card p-6 text-center">
                <div className="text-purple-400 text-2xl mb-2">🌟</div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Welcome back, {user.email?.split('@')[0]}!
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  Ready to create your next cosmic action plan?
                </p>
                <a
                  href="/timeline"
                  className="glass-button px-6 py-3 text-lg font-semibold hover:bg-white/30 transition-all inline-block"
                >
                  Generate Timeline
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* Trust Signals */}
        <div className="text-center mt-12">
          <p className="text-white/60 text-sm mb-2">
            ✨ Powered by Swiss Ephemeris & OpenAI ✨
          </p>
          <p className="text-white/50 text-xs">
            Professional-grade astrological calculations • AI-powered personalization
          </p>
        </div>
      </div>
    </section>
  );
}

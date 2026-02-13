'use client';

import Navigation from '@/components/Navigation';
import HomeHeroSection from '@/components/HomeHeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import WelcomeModal from '@/components/WelcomeModal';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isFirstTimeUser } = useAuth();

  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10">
        <HomeHeroSection user={user} />
        <FeaturesSection />
        <Footer />
      </div>

      {/* Welcome Modal for first-time users */}
      {user && isFirstTimeUser && (
        <WelcomeModal
          isOpen={isFirstTimeUser}
          onClose={() => {}}
        />
      )}
    </main>
  );
}

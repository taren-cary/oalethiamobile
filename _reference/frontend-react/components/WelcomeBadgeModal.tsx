'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface WelcomeBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeBadgeModal({ isOpen, onClose }: WelcomeBadgeModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [sparkleAnimation, setSparkleAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger animations
      setShowAnimation(true);
      setTimeout(() => setSparkleAnimation(true), 200);
    } else {
      // Reset animations when closed
      setShowAnimation(false);
      setSparkleAnimation(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Level 1 badge - first badge for new users
  const badgePath = `/assets/badges/level1.svg`;
  const levelName = 'Initiate of the Compass';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div 
        className={`glass-card p-8 max-w-md w-full mx-4 transform transition-all duration-700 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
          border: '2px solid rgba(255, 215, 0, 0.5)',
          boxShadow: '0 20px 60px rgba(255, 215, 0, 0.3)'
        }}
      >
        <div className="text-center">
          {/* Welcome emoji with animation */}
          <div className={`text-6xl mb-4 transition-all duration-500 ${
            sparkleAnimation ? 'animate-bounce scale-110' : 'scale-100'
          }`}>
            🌟
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 cosmic-text">
            Welcome to Oalethia!
          </h2>
          
          <p className="text-white/90 mb-6 text-lg">
            Your cosmic journey begins now. You've earned your first badge!
          </p>
          
          {/* Badge display */}
          <div className="flex items-center justify-center my-6">
            <div className="relative">
              <Image
                src={badgePath}
                alt={`${levelName} Badge`}
                width={120}
                height={120}
                className={`w-[120px] h-[120px] transition-all duration-500 ${
                  sparkleAnimation ? 'animate-pulse scale-110' : 'scale-100'
                }`}
                onError={(e) => {
                  // Fallback if image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {/* Sparkle effect */}
              {sparkleAnimation && (
                <>
                  <div className="absolute -top-2 -right-2 text-2xl animate-ping">✨</div>
                  <div className="absolute -bottom-2 -left-2 text-xl animate-ping" style={{ animationDelay: '0.3s' }}>⭐</div>
                  <div className="absolute top-1/2 -right-4 text-xl animate-ping" style={{ animationDelay: '0.6s' }}>💫</div>
                </>
              )}
            </div>
          </div>
          
          {/* Level name */}
          <h3 className="text-2xl font-bold text-yellow-400 mb-4 cosmic-text">
            Level 1: {levelName}
          </h3>
          
          {/* Message */}
          <p className="text-white/80 mb-6">
            Start your journey by creating your first timeline and earning points through daily affirmations!
          </p>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
          >
            Begin Your Journey
          </button>
        </div>
      </div>
    </div>
  );
}


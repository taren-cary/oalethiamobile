'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  levelName: string;
  previousLevel: number;
}

export default function LevelUpModal({ isOpen, onClose, newLevel, levelName, previousLevel }: LevelUpModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [sparkleAnimation, setSparkleAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger animations
      setShowAnimation(true);
      setTimeout(() => setSparkleAnimation(true), 200);
      
      // Auto close after 6 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      // Reset animations when closed
      setShowAnimation(false);
      setSparkleAnimation(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Badge image path - badges are named level1.svg through level12.svg
  const badgePath = `/assets/badges/level${newLevel}.svg`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
          {/* Celebration emoji with animation */}
          <div className={`text-6xl mb-4 transition-all duration-500 ${
            sparkleAnimation ? 'animate-bounce scale-110' : 'scale-100'
          }`}>
            🎉
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 cosmic-text">
            Level Up!
          </h2>
          
          {/* Level progression display */}
          <div className="flex items-center justify-center gap-4 my-6">
            <div className="text-4xl font-bold text-white/50">Lv.{previousLevel}</div>
            <div className="text-2xl text-yellow-400 animate-pulse">→</div>
            <div className="relative">
              <Image
                src={badgePath}
                alt={`${levelName} Badge`}
                width={80}
                height={80}
                className={`w-20 h-20 transition-all duration-500 ${
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
                </>
              )}
            </div>
            <div className="text-4xl font-bold text-white">Lv.{newLevel}</div>
          </div>
          
          {/* Level name */}
          <h3 className="text-2xl font-bold text-yellow-400 mb-4 cosmic-text">
            {levelName}
          </h3>
          
          {/* Message */}
          <p className="text-white/80 mb-6">
            Congratulations! You've reached a new achievement level.
          </p>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}


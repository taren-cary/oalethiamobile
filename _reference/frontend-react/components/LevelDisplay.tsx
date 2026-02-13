'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface LevelData {
  level: number;
  levelName: string;
  lifetimePoints: number;
  pointsForNextLevel: number | null;
  pointsNeeded: number;
  progressPercent: number;
  isMaxLevel: boolean;
}

export default function LevelDisplay() {
  const { user, session } = useAuth();
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && session) {
      fetchLevelData();
    } else {
      setLevelData(null);
      setLoading(false);
    }
  }, [user, session]);

  // Listen for level up events and points refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleLevelUp = () => {
      // Small delay to ensure backend has updated
      setTimeout(() => {
        fetchLevelData();
      }, 500);
    };

    const handleRefreshPoints = () => {
      fetchLevelData();
    };

    window.addEventListener('level-up', handleLevelUp);
    window.addEventListener('refresh-points', handleRefreshPoints);
    
    return () => {
      window.removeEventListener('level-up', handleLevelUp);
      window.removeEventListener('refresh-points', handleRefreshPoints);
    };
  }, [user, session]);

  const fetchLevelData = async () => {
    if (!user || !session) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-level`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLevelData(data);
      }
    } catch (error) {
      console.error('Error fetching level data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="glass-card p-4">
        <div className="animate-pulse">
          <div className="h-12 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!levelData) return null;

  // Badge image path - badges are named level1.svg through level12.svg
  const badgePath = `/assets/badges/level${levelData.level}.svg`;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Image
            src={badgePath}
            alt={`${levelData.levelName} Badge`}
            width={48}
            height={48}
            className="w-12 h-12"
            onError={(e) => {
              // Fallback if image doesn't exist
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm cosmic-text">
            Level {levelData.level}: {levelData.levelName}
          </div>
          {!levelData.isMaxLevel ? (
            <>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${levelData.progressPercent}%` }}
                />
              </div>
              <div className="text-white/60 text-xs mt-1">
                {levelData.pointsNeeded.toLocaleString()} points to next level
              </div>
            </>
          ) : (
            <div className="text-white/60 text-xs mt-1">
              Max level achieved! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


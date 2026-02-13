'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Image from 'next/image';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  lifetimePoints: number;
  level: number;
  levelName: string;
}

// Level names mapping
const LEVEL_NAMES: { [key: number]: string } = {
  1: 'Initiate of the Compass',
  2: 'Orbital Apprentice',
  3: 'Bearer of Intent',
  4: 'Awakened Navigator',
  5: 'Celestial Adept',
  6: 'Stellar Alchemist',
  7: 'Master of Arrival',
  8: 'Sage of the Void',
  9: 'Solar Oracle',
  10: 'Quantum Starseed',
  11: 'Cosmic Admiral',
  12: 'Eternal Sovereign'
};

// Generate fake leaderboard data with realistic usernames and point distributions for a new app
const generateFakeLeaderboard = (): LeaderboardEntry[] => {
  // Realistic Reddit-style usernames (typical of manifestation/spirituality communities)
  const fakeUsernames = [
    'alexrivera92', 'katieee_04', 'quantum_kiddo', 'himothy10', 'al1gned_sol',
    'jodeandcoffee', 'kevin.truong_', 'urbanlena', 'mikeonmain', 'jessica_1991x',
    'olivia_north', 'chrisT_89', 'johnnyfromtx', 'alex_lovespizza', 'brianwilliams1',
    'jenna.bee', 'stephaniee23', 'maria_garcia22', 'tommyyyboy', 'ericaaaa_lol',
    'nick_the_guy', 'lizbeth_12', 'sarahm_101', 'rachel_annn', 'nate_93_'
  ];
  
  // Realistic point distribution for a new app - most users in lower levels
  // Top user might be around level 4-5, with most in levels 2-3
  const basePoints = [
    450,   // 1st - Level 4
    380,   // 2nd - Level 4
    320,   // 3rd - Level 4
    280,   // 4th - Level 3
    250,   // 5th - Level 3
    220,   // 6th - Level 3
    200,   // 7th - Level 3
    180,   // 8th - Level 3
    160,   // 9th - Level 3
    145,   // 10th - Level 3
    130,   // 11th - Level 2
    120,   // 12th - Level 2
    110,   // 13th - Level 2
    100,   // 14th - Level 2
    95,    // 15th - Level 2
    90,    // 16th - Level 2
    85,    // 17th - Level 2
    80,    // 18th - Level 2
    75,    // 19th - Level 2
    70,    // 20th - Level 2
    65,    // 21st - Level 2
    60,    // 22nd - Level 2
    55,    // 23rd - Level 2
    50,    // 24th - Level 2
    45     // 25th - Level 2
  ];
  
  return Array.from({ length: 25 }, (_, i) => {
    const rank = i + 1;
    // Add some variation to points (±10%)
    const variation = Math.floor(Math.random() * (basePoints[i] * 0.2)) - (basePoints[i] * 0.1);
    const lifetimePoints = Math.max(25, basePoints[i] + variation);
    
    // Calculate level based on points (using the same thresholds as backend)
    let level = 1;
    if (lifetimePoints >= 75000) level = 12;
    else if (lifetimePoints >= 40000) level = 11;
    else if (lifetimePoints >= 20000) level = 10;
    else if (lifetimePoints >= 10000) level = 9;
    else if (lifetimePoints >= 5000) level = 8;
    else if (lifetimePoints >= 2500) level = 7;
    else if (lifetimePoints >= 1200) level = 6;
    else if (lifetimePoints >= 500) level = 5;
    else if (lifetimePoints >= 200) level = 4;
    else if (lifetimePoints >= 75) level = 3;
    else if (lifetimePoints >= 25) level = 2;
    
    return {
      rank,
      userId: `fake-${i}`,
      username: fakeUsernames[i] || `user_${i + 1}`,
      lifetimePoints,
      level,
      levelName: LEVEL_NAMES[level] || 'Unknown'
    };
  }).sort((a, b) => b.lifetimePoints - a.lifetimePoints);
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFakeData, setUseFakeData] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // Force fake data for now - will phase in real users later
    setUseFakeData(true);
    setLeaderboard(generateFakeLeaderboard());
    setLoading(false);
    
    // Commented out API call - uncomment when ready to phase in real users
    /*
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard?limit=25`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Format the data to match our interface, limit to top 25
          const formattedData = data.slice(0, 25).map((entry: any, index: number) => ({
            rank: index + 1,
            userId: entry.userId,
            username: entry.username || `user_${entry.userId.substring(0, 8)}`,
            lifetimePoints: entry.lifetimePoints || 0,
            level: entry.level || 1,
            levelName: entry.levelName || LEVEL_NAMES[entry.level || 1] || 'Unknown'
          }));
          setLeaderboard(formattedData);
        } else {
          // No real data, use fake data
          setUseFakeData(true);
          setLeaderboard(generateFakeLeaderboard());
        }
      } else {
        // API error, use fake data
        setUseFakeData(true);
        setLeaderboard(generateFakeLeaderboard());
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Network error, use fake data
      setUseFakeData(true);
      setLeaderboard(generateFakeLeaderboard());
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 cosmic-text">
              Leaderboard
            </h1>
            <p className="text-white/70 text-lg">
            Those Who Navigated The Odds & Reached Their Destination
            </p>
            {useFakeData && (
              <p className="text-white/50 text-sm mt-2">
                
              </p>
            )}
          </div>
          
          {loading ? (
            <div className="glass-card p-8 text-center">
              <div className="animate-pulse text-white">Loading leaderboard...</div>
            </div>
          ) : (
            <div className="glass-card p-6">
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const badgePath = `/assets/badges/level${entry.level}.svg`;
                  const isTopThree = index < 3;
                  
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all ${
                        isTopThree 
                          ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20 hover:from-yellow-500/40 hover:to-orange-500/40' 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`text-xl sm:text-2xl font-bold w-8 sm:w-12 text-center flex-shrink-0 ${
                        isTopThree ? 'text-yellow-300' : 'text-white'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                      </div>
                      
                      {/* Badge - badges are named level1.svg through level12.svg */}
                      <div className={`flex-shrink-0 ${isTopThree ? 'scale-110' : ''} transition-transform`}>
                        <Image
                          src={badgePath}
                          alt={`Level ${entry.level} Badge`}
                          width={40}
                          height={40}
                          className="w-8 h-8 sm:w-10 sm:h-10"
                          onError={(e) => {
                            // Hide image if it doesn't exist - level is shown in text anyway
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0 text-left ml-1 sm:ml-0">
                        <div className={`font-semibold truncate text-left ${
                          isTopThree ? 'text-yellow-100 text-base sm:text-lg' : 'text-white'
                        }`}>
                          {entry.username}
                        </div>
                        <div className={`text-xs sm:text-sm text-left ${
                          isTopThree ? 'text-yellow-200/80' : 'text-white/60'
                        }`}>
                          Level {entry.level}: {entry.levelName}
                        </div>
                      </div>
                      
                      {/* Points */}
                      <div className="text-right flex-shrink-0 ml-auto">
                        <div className={`font-bold text-sm sm:text-base ${
                          isTopThree ? 'text-yellow-300' : 'text-yellow-300'
                        }`}>
                          {entry.lifetimePoints.toLocaleString()}
                        </div>
                        <div className={`text-xs ${
                          isTopThree ? 'text-yellow-200/70' : 'text-white/60'
                        }`}>points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}


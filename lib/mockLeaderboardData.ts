/**
 * Leaderboard mock data and types.
 * Matches _reference/frontend-react/app/leaderboard/page.tsx and /api/leaderboard response.
 */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  lifetimePoints: number;
  level: number;
  levelName: string;
}

export const LEVEL_NAMES: Record<number, string> = {
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
  12: 'Eternal Sovereign',
};

const FAKE_USERNAMES = [
  'alexrivera92', 'katieee_04', 'quantum_kiddo', 'himothy10', 'al1gned_sol',
  'jodeandcoffee', 'kevin.truong_', 'urbanlena', 'mikeonmain', 'jessica_1991x',
  'olivia_north', 'chrisT_89', 'johnnyfromtx', 'alex_lovespizza', 'brianwilliams1',
  'jenna.bee', 'stephaniee23', 'maria_garcia22', 'tommyyyboy', 'ericaaaa_lol',
  'nick_the_guy', 'lizbeth_12', 'sarahm_101', 'rachel_annn', 'nate_93_',
];

const BASE_POINTS = [
  450, 380, 320, 280, 250, 220, 200, 180, 160, 145,
  130, 120, 110, 100, 95, 90, 85, 80, 75, 70,
  65, 60, 55, 50, 45,
];

function pointsToLevel(lifetimePoints: number): number {
  if (lifetimePoints >= 75000) return 12;
  if (lifetimePoints >= 40000) return 11;
  if (lifetimePoints >= 20000) return 10;
  if (lifetimePoints >= 10000) return 9;
  if (lifetimePoints >= 5000) return 8;
  if (lifetimePoints >= 2500) return 7;
  if (lifetimePoints >= 1200) return 6;
  if (lifetimePoints >= 500) return 5;
  if (lifetimePoints >= 200) return 4;
  if (lifetimePoints >= 75) return 3;
  if (lifetimePoints >= 25) return 2;
  return 1;
}

/**
 * Generate fake leaderboard data (same distribution as web reference).
 */
export function generateFakeLeaderboard(limit = 25): LeaderboardEntry[] {
  return Array.from({ length: limit }, (_, i) => {
    const variation = Math.floor(Math.random() * (BASE_POINTS[i] * 0.2)) - (BASE_POINTS[i] * 0.1);
    const lifetimePoints = Math.max(25, BASE_POINTS[i] + variation);
    const level = pointsToLevel(lifetimePoints);
    return {
      rank: i + 1,
      userId: `fake-${i}`,
      username: FAKE_USERNAMES[i] ?? `user_${i + 1}`,
      lifetimePoints,
      level,
      levelName: LEVEL_NAMES[level] ?? 'Unknown',
    };
  }).sort((a, b) => b.lifetimePoints - a.lifetimePoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

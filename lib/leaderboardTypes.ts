export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
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

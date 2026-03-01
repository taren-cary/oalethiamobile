import type { LevelData } from '@/components/points-level-badge';
import type { SavedTimeline } from '@/types/timeline';

/** Single "today's affirmation" item (one per timeline). Used for both mock and real data. */
export interface TodayAffirmationItem {
  timelineId: string;
  outcome: string;
  affirmationText: string;
  imageUrl: string | null;
  affirmed: boolean;
  affirmationIndex: number;
}

/** @deprecated Use TodayAffirmationItem */
export type MockTodayAffirmation = TodayAffirmationItem;

export interface MockHomeData {
  streak: number;
  levelData: LevelData;
  latestTimeline: SavedTimeline;
  affirmationText: string;
  affirmationIndex: number;
  affirmed: boolean;
  /** When length > 1, Home shows swipeable affirmation cards (dev preview). */
  todayAffirmations: TodayAffirmationItem[];
}

/**
 * Whether Home/Today should use mock data instead of live API/Supabase data.
 *
 * Currently enabled automatically in development when there is no signed-in user.
 * In production builds this will always be false.
 */
export const HOME_DEV_MODE = __DEV__;

export function getMockHomeData(): MockHomeData {
  const now = new Date();
  const createdAt = new Date(now);
  createdAt.setDate(createdAt.getDate() - 7);

  const latestTimeline: SavedTimeline = {
    id: 'mock-timeline-1',
    user_id: 'mock-user-id',
    outcome: 'Launch my first paid cosmic coaching offer',
    context:
      'You are building a spiritually aligned coaching business and want your first paid offer to feel in flow, not forced.',
    timeframe: 90,
    actions: [
      {
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        action:
          'Host a live “Cosmic Alignment Session” on Instagram and invite your warm audience.',
        transit: 'Sun trine Jupiter',
        strategy:
          'Focus on generosity and service; trust that value shared now will magnetize ideal clients.',
      },
      {
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        action:
          'Refine your signature offer into a clear three-part journey with a simple, soulful landing page.',
        transit: 'Venus sextile Saturn',
        strategy:
          'Blend beauty with structure. Name each phase of the journey and anchor it in tangible outcomes.',
      },
      {
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        action:
          'Invite three dream clients into a beta round at a grounded, easeful price point.',
        transit: 'Mars conjunct North Node',
        strategy:
          'Take courageous, heart-led action. Reach out personally rather than waiting for people to find you.',
      },
    ],
    timeline_affirmations: [
      'I trust that my work is needed, and the right people are already on their way to me.',
      'I am allowed to be well-paid for the magic I bring to others.',
      'Every aligned action I take plants a star in my future sky.',
    ],
    summary: { actionsGenerated: 3 },
    credits_used: 1,
    created_at: createdAt.toISOString(),
  };

  const levelData: LevelData = {
    level: 3,
    levelName: 'Bearer of Intent',
    lifetimePoints: 140,
    pointsForNextLevel: 200,
    pointsNeeded: 60,
    progressPercent: 55,
    isMaxLevel: false,
  };

  const affirmationIndex = 0;
  const affirmationText =
    'I am aligned with my cosmic path, and every step I take is supported by the universe.';

  // Multiple affirmations for swipeable cards preview in signed-out dev view
  const todayAffirmations: TodayAffirmationItem[] = [
    {
      timelineId: 'mock-timeline-1',
      outcome: 'Launch my first paid cosmic coaching offer',
      affirmationText:
        'I am aligned with my cosmic path, and every step I take is supported by the universe.',
      imageUrl: null,
      affirmed: false,
      affirmationIndex: 0,
    },
    {
      timelineId: 'mock-timeline-2',
      outcome: 'Build a morning meditation habit',
      affirmationText:
        'I welcome stillness each morning; my mind is clear and my intentions are strong.',
      imageUrl: null,
      affirmed: true,
      affirmationIndex: 2,
    },
    {
      timelineId: 'mock-timeline-3',
      outcome: 'Strengthen my closest relationships',
      affirmationText:
        'I show up with an open heart and attract deeper connection every day.',
      imageUrl: null,
      affirmed: false,
      affirmationIndex: 1,
    },
  ];

  return {
    streak: 7,
    levelData,
    latestTimeline,
    affirmationText,
    affirmationIndex,
    affirmed: false,
    todayAffirmations,
  };
}


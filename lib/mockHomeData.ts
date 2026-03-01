import type { LevelData } from '@/components/points-level-badge';
import type { SavedTimeline, TimelineAction } from '@/types/timeline';

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

/** One timeline's "next action" for home next-action cards (dev or real). */
export interface NextActionItem {
  timeline: SavedTimeline;
  nextAction: TimelineAction;
  nextActionOriginalIndex: number;
  completed: number[];
  skipped: number[];
}

export interface MockHomeData {
  streak: number;
  levelData: LevelData;
  latestTimeline: SavedTimeline;
  affirmationText: string;
  affirmationIndex: number;
  affirmed: boolean;
  /** When length > 1, Home shows swipeable affirmation cards (dev preview). */
  todayAffirmations: TodayAffirmationItem[];
  /** Next action per timeline for dev home (animated pulse, countdown, etc.). */
  recentTimelinesWithNextActions: NextActionItem[];
}

/**
 * Whether Home/Today should use mock data instead of live API/Supabase data.
 *
 * Currently enabled automatically in development when there is no signed-in user.
 * In production builds this will always be false.
 */
export const HOME_DEV_MODE = __DEV__;

/** Compute next action for a timeline given completed/skipped indices. */
export function getNextActionItem(
  timeline: SavedTimeline,
  completed: number[],
  skipped: number[]
): NextActionItem | null {
  const visible = timeline.actions.filter((_, i) => !skipped.includes(i));
  const nextIdx = visible.findIndex(
    (a) => !completed.includes(timeline.actions.indexOf(a))
  );
  if (nextIdx < 0) return null;
  const nextAction = visible[nextIdx];
  const nextActionOriginalIndex = timeline.actions.indexOf(nextAction);
  return {
    timeline,
    nextAction,
    nextActionOriginalIndex,
    completed,
    skipped,
  };
}

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

  // Second timeline for next-action cards (dev)
  const timeline2: SavedTimeline = {
    id: 'mock-timeline-2',
    user_id: 'mock-user-id',
    outcome: 'Build a morning meditation habit',
    context: 'Starting the day with 10 minutes of stillness.',
    timeframe: 30,
    actions: [
      {
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        action: 'Set a daily 7am alarm and sit in silence for 5 minutes.',
        transit: 'Moon in Pisces',
        strategy:
          'Pisces supports introspection. Keep it simple: breath focus or a short mantra.',
      },
      {
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        action: 'Extend to 10 minutes and add one grounding affirmation.',
        transit: 'Mercury trine Neptune',
        strategy: 'Let intuition guide your wording; write it down the night before.',
      },
    ],
    timeline_affirmations: [
      'I welcome stillness each morning; my mind is clear and my intentions are strong.',
    ],
    summary: { actionsGenerated: 2 },
    credits_used: 0,
    created_at: createdAt.toISOString(),
  };

  // Third timeline for next-action cards (dev)
  const timeline3: SavedTimeline = {
    id: 'mock-timeline-3',
    user_id: 'mock-user-id',
    outcome: 'Strengthen my closest relationships',
    context: 'Quality time and honest communication.',
    timeframe: 60,
    actions: [
      {
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        action: 'Schedule one 1:1 call or meal with a person you care about this week.',
        transit: 'Venus in Gemini',
        strategy:
          'Conversation and curiosity. Ask one deep question and really listen.',
      },
    ],
    timeline_affirmations: [
      'I show up with an open heart and attract deeper connection every day.',
    ],
    summary: { actionsGenerated: 1 },
    credits_used: 0,
    created_at: createdAt.toISOString(),
  };

  const recentTimelinesWithNextActions: NextActionItem[] = [
    getNextActionItem(latestTimeline, [], [])!,
    getNextActionItem(timeline2, [], [])!,
    getNextActionItem(timeline3, [], [])!,
  ];

  return {
    streak: 7,
    levelData,
    latestTimeline,
    affirmationText,
    affirmationIndex,
    affirmed: false,
    todayAffirmations,
    recentTimelinesWithNextActions,
  };
}


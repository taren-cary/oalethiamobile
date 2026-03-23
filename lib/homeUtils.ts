import type { SavedTimeline, TimelineAction } from '@/types/timeline';

/** Single "today's affirmation" item (one per timeline). */
export interface TodayAffirmationItem {
  timelineId: string;
  outcome: string;
  affirmationText: string;
  imageUrl: string | null;
  affirmed: boolean;
  affirmationIndex: number;
}

/** One timeline's "next action" for home next-action cards. */
export interface NextActionItem {
  timeline: SavedTimeline;
  nextAction: TimelineAction;
  nextActionOriginalIndex: number;
  completed: number[];
  skipped: number[];
}

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

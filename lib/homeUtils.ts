import { parseActionDate } from './parseActionDate';
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

/**
 * Compute next action for a timeline given completed/skipped indices.
 * Only returns actions whose date is in the future — past uncompleted actions
 * are considered "missed" and are skipped over automatically.
 */
export function getNextActionItem(
  timeline: SavedTimeline,
  completed: number[],
  skipped: number[]
): NextActionItem | null {
  const now = new Date();
  for (let i = 0; i < timeline.actions.length; i++) {
    if (completed.includes(i)) continue;
    if (skipped.includes(i)) continue;
    const date = parseActionDate(timeline.actions[i].date);
    if (date < now) continue; // Past uncompleted = missed, skip over it
    return {
      timeline,
      nextAction: timeline.actions[i],
      nextActionOriginalIndex: i,
      completed,
      skipped,
    };
  }
  return null;
}

/**
 * Returns indices of actions that are past their date and were neither
 * completed nor skipped — i.e. missed.
 */
export function getMissedActionIndices(
  timeline: SavedTimeline,
  completed: number[],
  skipped: number[]
): number[] {
  const now = new Date();
  return timeline.actions
    .map((action, index) => ({ action, index }))
    .filter(({ action, index }) => {
      if (completed.includes(index)) return false;
      if (skipped.includes(index)) return false;
      return parseActionDate(action.date) < now;
    })
    .map(({ index }) => index);
}

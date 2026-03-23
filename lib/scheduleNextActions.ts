import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NextActionItem } from '@/lib/homeUtils';
import { parseActionDate } from '@/lib/parseActionDate';
import type { TimeOfDay } from '@/lib/notifications';
import { ACTION_IDS_KEY, requestNotificationPermissions } from '@/lib/notifications';

export async function scheduleNextActionReminders(
  items: NextActionItem[],
  time: TimeOfDay
): Promise<string[]> {
  const ok = await requestNotificationPermissions();
  if (!ok) return [];

  const now = new Date();
  const ids: string[] = [];

  const byDate = new Map<string, NextActionItem[]>();

  for (const item of items) {
    const targetDate = parseActionDate(item.nextAction.date);
    if (!targetDate) continue;
    if (targetDate < now) continue;

    const dayKey = targetDate.toISOString().split('T')[0];
    const current = byDate.get(dayKey) ?? [];
    current.push(item);
    byDate.set(dayKey, current);
  }

  for (const [dayKey, dayItems] of byDate.entries()) {
    const [year, month, day] = dayKey.split('-').map(Number);
    const triggerDate = new Date(year, month - 1, day, time.hour, time.minute);
    if (triggerDate <= now) continue;

    const count = dayItems.length;
    const firstGoal = dayItems[0].timeline.outcome;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title:
          count === 1
            ? 'Your next action is today'
            : `You have ${count} actions today`,
        body:
          count === 1
            ? `Your next step for “${firstGoal}” is due today.`
            : 'Open Oalethia to review and take your next steps.',
        data: { type: 'next-actions', date: dayKey, count },
      },
      trigger: triggerDate,
    });

    ids.push(id);

    // Optional: 3-days-before reminder
    const threeDaysBefore = new Date(triggerDate);
    threeDaysBefore.setDate(triggerDate.getDate() - 3);
    if (threeDaysBefore > now) {
      const idPre = await Notifications.scheduleNotificationAsync({
        content: {
          title:
            count === 1
              ? 'Action coming up in 3 days'
              : `${count} actions in 3 days`,
          body:
            count === 1
              ? `You have an important action for “${firstGoal}” in 3 days.`
              : 'You have several actions coming up soon. Open Oalethia to get ready.',
          data: { type: 'next-actions-pre', date: dayKey, count },
        },
        trigger: threeDaysBefore,
      });
      ids.push(idPre);
    }
  }

  if (ids.length) {
    await AsyncStorage.setItem(ACTION_IDS_KEY, JSON.stringify(ids));
  }

  return ids;
}


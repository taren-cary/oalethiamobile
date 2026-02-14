import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'oalethia_timeline_';

export async function getProgress(timelineId: string): Promise<{
  completed: number[];
  skipped: number[];
  affirmationIndex: number;
  affirmationDate: string | null;
  affirmedDate: string | null;
}> {
  try {
    const [completed, skipped, index, aDate, affirmed] = await Promise.all([
      AsyncStorage.getItem(`${PREFIX}${timelineId}_completed`),
      AsyncStorage.getItem(`${PREFIX}${timelineId}_skipped`),
      AsyncStorage.getItem(`${PREFIX}${timelineId}_affirmation_index`),
      AsyncStorage.getItem(`${PREFIX}${timelineId}_affirmation_date`),
      AsyncStorage.getItem(`${PREFIX}${timelineId}_affirmed_date`),
    ]);
    return {
      completed: completed ? JSON.parse(completed) : [],
      skipped: skipped ? JSON.parse(skipped) : [],
      affirmationIndex: index != null ? parseInt(index, 10) : 0,
      affirmationDate: aDate,
      affirmedDate: affirmed,
    };
  } catch {
    return {
      completed: [],
      skipped: [],
      affirmationIndex: 0,
      affirmationDate: null,
      affirmedDate: null,
    };
  }
}

export async function saveProgress(
  timelineId: string,
  data: {
    completed?: number[];
    skipped?: number[];
    affirmationIndex?: number;
    affirmationDate?: string;
    affirmedDate?: string;
  }
): Promise<void> {
  const keys: [string, string][] = [];
  if (data.completed != null) keys.push([`${PREFIX}${timelineId}_completed`, JSON.stringify(data.completed)]);
  if (data.skipped != null) keys.push([`${PREFIX}${timelineId}_skipped`, JSON.stringify(data.skipped)]);
  if (data.affirmationIndex != null) keys.push([`${PREFIX}${timelineId}_affirmation_index`, String(data.affirmationIndex)]);
  if (data.affirmationDate != null) keys.push([`${PREFIX}${timelineId}_affirmation_date`, data.affirmationDate]);
  if (data.affirmedDate != null) keys.push([`${PREFIX}${timelineId}_affirmed_date`, data.affirmedDate]);
  await Promise.all(keys.map(([k, v]) => AsyncStorage.setItem(k, v)));
}

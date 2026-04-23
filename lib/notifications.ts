import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export interface NotificationPreferences {
  dailyEnabled: boolean;
  dailyTime: TimeOfDay;
  actionsEnabled: boolean;
  actionsTime: TimeOfDay;
}

const DEFAULT_TIME: TimeOfDay = { hour: 8, minute: 0 };

const PREFS_KEY = '@oalethia/notifications/prefs_v1';
export const DAILY_ID_KEY = '@oalethia/notifications/daily_id_v1';
export const ACTION_IDS_KEY = '@oalethia/notifications/action_ids_v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (
    existing.granted ||
    existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  const result = await Notifications.requestPermissionsAsync();
  return (
    !!result.granted ||
    result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) {
      return {
        dailyEnabled: false,
        dailyTime: DEFAULT_TIME,
        actionsEnabled: false,
        actionsTime: DEFAULT_TIME,
      };
    }
    const parsed = JSON.parse(raw) as NotificationPreferences;
    return {
      dailyEnabled: parsed.dailyEnabled ?? false,
      dailyTime: parsed.dailyTime ?? DEFAULT_TIME,
      actionsEnabled: parsed.actionsEnabled ?? false,
      actionsTime: parsed.actionsTime ?? DEFAULT_TIME,
    };
  } catch {
    return {
      dailyEnabled: false,
      dailyTime: DEFAULT_TIME,
      actionsEnabled: false,
      actionsTime: DEFAULT_TIME,
    };
  }
}

export async function saveNotificationPreferences(
  prefs: NotificationPreferences
): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function scheduleDailyAffirmationReminder(
  time: TimeOfDay
): Promise<string | null> {
  const ok = await requestNotificationPermissions();
  if (!ok) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Today's cosmic affirmation",
      body: 'Open Oalethia to affirm and keep your streak going.',
      data: { type: 'daily-affirmation' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
    },
  });

  await AsyncStorage.setItem(DAILY_ID_KEY, id);
  return id;
}

export async function cancelDailyAffirmationReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(DAILY_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  await AsyncStorage.removeItem(DAILY_ID_KEY);
}

export async function cancelActionReminders(): Promise<void> {
  const raw = await AsyncStorage.getItem(ACTION_IDS_KEY);
  if (raw) {
    try {
      const ids = JSON.parse(raw) as string[];
      await Promise.all(
        ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
      );
    } catch {
      // ignore parse errors
    }
  }
  await AsyncStorage.removeItem(ACTION_IDS_KEY);
}


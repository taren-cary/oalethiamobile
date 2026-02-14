import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassCard } from '@/components/glass';
import { PointsLevelBadge } from '@/components/points-level-badge';
import type { LevelData } from '@/components/points-level-badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session, signOut } = useAuth();

  const [profileLoading, setProfileLoading] = useState(true);
  const [levelLoading, setLevelLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    tier?: { name?: string };
    isFree?: boolean;
    status?: string;
  } | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session) {
      setProfileLoading(false);
      return;
    }
    try {
      const res = await apiGet('/api/profile', session);
      if (res.ok) {
        const data = await res.json();
        setStreak(data.stats?.currentStreak ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setProfileLoading(false);
    }
  }, [session]);

  const fetchLevel = useCallback(async () => {
    if (!session) {
      setLevelLoading(false);
      return;
    }
    try {
      const res = await apiGet('/api/user-level', session);
      if (res.ok) {
        const data = await res.json();
        setLevelData({
          level: data.level,
          levelName: data.levelName,
          lifetimePoints: data.lifetimePoints ?? 0,
          pointsForNextLevel: data.pointsForNextLevel ?? null,
          pointsNeeded: data.pointsNeeded ?? 0,
          progressPercent: data.progressPercent ?? 0,
          isMaxLevel: data.isMaxLevel ?? false,
        });
      }
    } catch {
      // ignore
    } finally {
      setLevelLoading(false);
    }
  }, [session]);

  const fetchSubscription = useCallback(async () => {
    if (!session) {
      setSubscriptionLoading(false);
      return;
    }
    try {
      const res = await apiGet('/api/user-subscription', session);
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data);
      } else {
        setSubscriptionStatus({ isFree: true, status: 'active' });
      }
    } catch {
      setSubscriptionStatus({ isFree: true, status: 'active' });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfile();
    fetchLevel();
    fetchSubscription();
  }, [fetchProfile, fetchLevel, fetchSubscription]);

  const paddingTop = insets.top + glassSpacing.md;
  const paddingBottom = insets.bottom + 100;

  if (!user) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpg')}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={300}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop, paddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Profile</Text>
          <GlassCard>
            <Text style={styles.body}>Sign in to view your profile, streak, and subscription.</Text>
            <GlassButton
              title="Sign in"
              onPress={() => router.push('/modal')}
              accessibilityLabel="Sign in"
            />
          </GlassCard>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpg')}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={300}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop, paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {profileLoading ? (
          <ActivityIndicator size="small" color={glassColors.primary} />
        ) : (
          <GlassCard cardStyle={styles.streakCard}>
            <Text style={styles.streakLabel}>Affirmation streak</Text>
            <Text style={styles.streakValue}>
              {streak} day{streak !== 1 ? 's' : ''}
            </Text>
          </GlassCard>
        )}

        {levelLoading ? (
          <ActivityIndicator size="small" color={glassColors.primary} />
        ) : levelData ? (
          <PointsLevelBadge levelData={levelData} />
        ) : null}

        {subscriptionLoading ? (
          <ActivityIndicator size="small" color={glassColors.primary} />
        ) : (
          <GlassCard cardStyle={styles.subCard}>
            <Text style={styles.subLabel}>Subscription</Text>
            <Text style={styles.subValue}>
              {subscriptionStatus?.isFree
                ? 'Free'
                : subscriptionStatus?.tier?.name ?? 'Free'}
            </Text>
          </GlassCard>
        )}

        <GlassCard cardStyle={styles.settingsCard}>
          <Text style={styles.settingsLabel}>Settings</Text>
          <Text style={styles.settingsHint}>
            Notifications and account settings (placeholder).
          </Text>
        </GlassCard>

        <GlassButton
          title="Upgrade / Buy credits"
          onPress={() => router.push('/modal')}
          variant="secondary"
          style={styles.button}
          accessibilityLabel="Open subscription or credits modal"
        />
        <GlassButton
          title="Sign out"
          onPress={() => signOut()}
          variant="secondary"
          style={styles.button}
          accessibilityLabel="Sign out of your account"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: glassSpacing.screenPadding,
    gap: glassSpacing.sectionGap,
    paddingBottom: 24,
  },
  title: {
    ...glassTypography.h2,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.sm,
  },
  body: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.md,
  },
  streakCard: {
    paddingVertical: glassSpacing.md,
  },
  streakLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 4,
  },
  streakValue: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  subCard: {
    paddingVertical: glassSpacing.md,
  },
  subLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 4,
  },
  subValue: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  settingsCard: {
    paddingVertical: glassSpacing.md,
  },
  settingsLabel: {
    ...glassTypography.label,
    color: glassColors.text.primary,
    marginBottom: 4,
  },
  settingsHint: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
  button: {
    alignSelf: 'stretch',
  },
});

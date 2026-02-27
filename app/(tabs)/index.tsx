import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useShare } from '@/contexts/ShareContext';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AffirmationCard } from '@/components/affirmation-card';
import { GlassButton, GlassCard } from '@/components/glass';
import type { LevelData } from '@/components/points-level-badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLevelUp } from '@/contexts/LevelUpContext';
import { usePointsRefresh } from '@/contexts/PointsRefreshContext';
import { apiGet, apiPost } from '@/lib/api';
import { getMockHomeData, HOME_DEV_MODE } from '@/lib/mockHomeData';
import { supabase } from '@/lib/supabase';
import type { SavedTimeline } from '@/types/timeline';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

const LEVEL_BADGE_SOURCES: Record<number, any> = {
  1: require('@/assets/badges/level1.svg'),
  2: require('@/assets/badges/level2.svg'),
  3: require('@/assets/badges/level3.svg'),
  4: require('@/assets/badges/level4.svg'),
  5: require('@/assets/badges/level5.svg'),
  6: require('@/assets/badges/level6.svg'),
  7: require('@/assets/badges/level7.svg'),
  8: require('@/assets/badges/level8.svg'),
  9: require('@/assets/badges/level9.svg'),
  10: require('@/assets/badges/level10.svg'),
  11: require('@/assets/badges/level11.svg'),
  12: require('@/assets/badges/level12.svg'),
};

function getLevelBadgeSource(level: number) {
  if (level <= 1) {
    return LEVEL_BADGE_SOURCES[1];
  }
  if (level >= 12) {
    return LEVEL_BADGE_SOURCES[12];
  }
  return LEVEL_BADGE_SOURCES[level] ?? LEVEL_BADGE_SOURCES[1];
}

const DEFAULT_AFFIRMATION =
  'I am aligned with my purpose and open to the guidance of the cosmos.';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { setShare } = useShare();
  const { setLevelUp } = useLevelUp();
  const { invalidate, invalidateAt } = usePointsRefresh();

  const useDevHomeData = HOME_DEV_MODE && !user;
  const mockData = useDevHomeData ? getMockHomeData() : null;

  const [profileLoading, setProfileLoading] = useState(!useDevHomeData);
  const [levelLoading, setLevelLoading] = useState(!useDevHomeData);
  const [streak, setStreak] = useState(
    useDevHomeData && mockData ? mockData.streak : 0
  );
  const [levelData, setLevelData] = useState<LevelData | null>(
    useDevHomeData && mockData ? mockData.levelData : null
  );
  const [latestTimeline, setLatestTimeline] = useState<SavedTimeline | null>(
    useDevHomeData && mockData ? mockData.latestTimeline : null
  );
  const [affirmationText, setAffirmationText] = useState(
    useDevHomeData && mockData
      ? mockData.affirmationText
      : DEFAULT_AFFIRMATION
  );
  const [affirmationIndex, setAffirmationIndex] = useState(
    useDevHomeData && mockData ? mockData.affirmationIndex : 0
  );
  const [affirmed, setAffirmed] = useState(
    useDevHomeData && mockData ? mockData.affirmed : false
  );
  const [affirmLoading, setAffirmLoading] = useState(false);

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

  const fetchLatestTimeline = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('action_timeline_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestTimeline(data ?? null);
    } catch {
      setLatestTimeline(null);
    }
  }, [user]);

  const fetchTodayAffirmation = useCallback(async () => {
    if (!latestTimeline?.id || !session) {
      if (!latestTimeline && user) {
        setAffirmationText(DEFAULT_AFFIRMATION);
      }
      return;
    }
    try {
      const res = await apiGet(
        `/api/today-affirmation/${latestTimeline.id}`,
        session
      );
      if (res.ok) {
        const data = await res.json();
        setAffirmationIndex(data.affirmation_index ?? 0);
        setAffirmationText(data.affirmation_text ?? DEFAULT_AFFIRMATION);
        setAffirmed(data.affirmed === true);
      } else if (latestTimeline.timeline_affirmations?.length) {
        const idx = 0;
        setAffirmationText(
          latestTimeline.timeline_affirmations[idx] ?? DEFAULT_AFFIRMATION
        );
      }
    } catch {
      if (latestTimeline.timeline_affirmations?.length) {
        setAffirmationText(
          latestTimeline.timeline_affirmations[0] ?? DEFAULT_AFFIRMATION
        );
      }
    }
  }, [latestTimeline, session, user]);

  useEffect(() => {
    if (useDevHomeData) {
      return;
    }
    fetchProfile();
    fetchLevel();
    fetchLatestTimeline();
  }, [fetchProfile, fetchLevel, fetchLatestTimeline, useDevHomeData]);

  useEffect(() => {
    if (useDevHomeData || invalidateAt <= 0) {
      return;
    }
    fetchLevel();
    fetchProfile();
  }, [invalidateAt, fetchLevel, fetchProfile, useDevHomeData]);

  useEffect(() => {
    if (useDevHomeData) {
      return;
    }
    fetchTodayAffirmation();
  }, [fetchTodayAffirmation, useDevHomeData]);

  const handleAffirm = useCallback(async () => {
    if (useDevHomeData) {
      if (affirmLoading || affirmed) {
        return;
      }
      setAffirmLoading(true);
      setAffirmed(true);
      setTimeout(() => {
        setAffirmLoading(false);
      }, 300);
      return;
    }
    if (!session || affirmLoading) return;
    const generationId = latestTimeline?.id ?? 'temp_unsaved';
    setAffirmLoading(true);
    setAffirmed(true);

    try {
      const res = await apiPost(
        '/api/affirm',
        session,
        {
          generation_id: generationId,
          affirmation_index: affirmationIndex,
          affirmation_text: affirmationText,
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.levelUp) {
          setLevelUp({
            newLevel: data.levelUp.newLevel,
            levelName: data.levelUp.levelName,
            previousLevel: data.levelUp.previousLevel,
          });
        }
        invalidate();
      }
    } catch {
      // keep affirmed locally
    } finally {
      setAffirmLoading(false);
    }
  }, [
    session,
    latestTimeline?.id,
    affirmationIndex,
    affirmationText,
    affirmLoading,
    setLevelUp,
    invalidate,
  ]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const paddingTop = insets.top + glassSpacing.md;
  const paddingBottom = insets.bottom + 100;

  if (!user && !useDevHomeData) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpeg')}
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
          <Text style={styles.brandTitle}>Home</Text>
          <Text style={styles.brandSubtitle}>
            Your cosmic journey begins here.
          </Text>
          <AffirmationCard
            text={DEFAULT_AFFIRMATION}
            date={todayFormatted}
            affirmed={false}
            onAffirm={() => {}}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpeg')}
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
        <Text style={styles.brandTitle}>Home</Text>
        {(profileLoading || levelLoading) ? (
          <ActivityIndicator size="small" color={glassColors.primary} />
        ) : (
          levelData && (
            <GlassCard blur="light" cardStyle={styles.topStatsCard}>
              <View style={styles.topStatsRow}>
                <View style={styles.topBadgeWrapper}>
                  <Image
                    source={getLevelBadgeSource(levelData.level)}
                    style={styles.topBadgeImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.topStatsContent}>
                  <View style={styles.topLevelBlock}>
                    <Text style={styles.topLevelText} numberOfLines={1}>
                      Level {levelData.level}: {levelData.levelName}
                    </Text>
                    {!levelData.isMaxLevel ? (
                      <>
                        <View style={styles.topProgressTrack}>
                          <LinearGradient
                            colors={glassColors.progressBar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                              styles.topProgressFill,
                              { width: `${levelData.progressPercent}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.topPointsToNext}>
                          {levelData.pointsNeeded.toLocaleString()} points to
                          next level
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.topPointsToNext}>
                        Max level achieved
                      </Text>
                    )}
                  </View>
                  <View style={styles.topStatsDivider} />
                  <View style={styles.topRightStats}>
                    <View style={styles.topStatItem}>
                      <Text style={styles.topStatLabel}>Lifetime</Text>
                      <Text style={styles.topStatValue}>
                        {levelData.lifetimePoints.toLocaleString()} pts
                      </Text>
                    </View>
                    <View style={styles.topStatItem}>
                      <Text style={styles.topStatLabel}>Streak</Text>
                      <Text style={styles.topStatValue}>
                        {streak} day{streak !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </GlassCard>
          )
        )}

        <AffirmationCard
          text={affirmationText}
          date={todayFormatted}
          affirmed={affirmed}
          onAffirm={handleAffirm}
          onShare={() => {
            setShare(affirmationText, "Today's cosmic affirmation");
            router.push({ pathname: '/modal', params: { type: 'share' } });
          }}
        />

        {latestTimeline && (
          <Pressable
            onPress={() => router.push({ pathname: '/timeline/[id]', params: { id: latestTimeline.id } })}
            style={({ pressed }) => [pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open timeline: ${latestTimeline.outcome}`}
          >
            <GlassCard>
              <Text style={styles.previewLabel}>Active timeline</Text>
              <Text style={styles.previewGoal} numberOfLines={2}>
                {latestTimeline.outcome}
              </Text>
              <Text style={styles.previewMeta}>
                {latestTimeline.actions?.length ?? 0} actions · Created{' '}
                {new Date(latestTimeline.created_at).toLocaleDateString()}
              </Text>
            </GlassCard>
          </Pressable>
        )}
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
    paddingBottom: 24,
    gap: glassSpacing.sectionGap,
  },
  brandTitle: {
    ...glassTypography.h2,
    color: glassColors.text.primary,
    marginBottom: 4,
  },
  brandSubtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.lg,
  },
  topStatsCard: {
    paddingVertical: glassSpacing.sm,
    paddingHorizontal: glassSpacing.md,
  },
  topStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBadgeWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: glassSpacing.md,
  },
  topBadgeImage: {
    width: '100%',
    height: '100%',
  },
  topStatsContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLevelBlock: {
    flex: 1,
    paddingRight: glassSpacing.md,
    minWidth: 0,
  },
  topLevelText: {
    ...glassTypography.label,
    color: glassColors.text.primary,
  },
  topProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: glassColors.glass.light,
    overflow: 'hidden',
    marginTop: glassSpacing.sm,
  },
  topProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  topPointsToNext: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: glassSpacing.xs,
  },
  topStatsDivider: {
    width: 1,
    height: '100%',
    backgroundColor: glassColors.glassBorder.subtle,
    marginHorizontal: glassSpacing.sm,
  },
  topRightStats: {
    justifyContent: 'center',
    gap: glassSpacing.xs,
  },
  topStatItem: {
    alignItems: 'flex-end',
  },
  topStatLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
  },
  topStatValue: {
    ...glassTypography.label,
    color: glassColors.text.primary,
  },
  pressed: {
    opacity: 0.9,
  },
  previewLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 4,
  },
  previewGoal: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
    marginBottom: 4,
  },
  previewMeta: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
});

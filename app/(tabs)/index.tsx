import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShare } from '@/contexts/ShareContext';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AffirmationCard,
  SwipeableAffirmationCard,
} from '@/components/affirmation-card';
import { GlassButton, GlassCard } from '@/components/glass';
import { NextActionCard } from '@/components/next-action-card/NextActionCard';
import type { LevelData } from '@/components/points-level-badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLevelUp } from '@/contexts/LevelUpContext';
import { usePointsRefresh } from '@/contexts/PointsRefreshContext';
import { apiGet, apiPost } from '@/lib/api';
import {
  getMockHomeData,
  getNextActionItem,
  HOME_DEV_MODE,
  type NextActionItem,
  type TodayAffirmationItem,
} from '@/lib/mockHomeData';
import { getProgress, saveProgress } from '@/lib/progress-storage';
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
  const [affirmationImageUrl, setAffirmationImageUrl] = useState<string | null>(null);
  const [affirmLoading, setAffirmLoading] = useState(false);
  /** Dev only: track which timeline IDs were affirmed in the swipeable carousel. */
  const [affirmedTimelineIdsDev, setAffirmedTimelineIdsDev] = useState<string[]>([]);
  /** Signed-in: all today's affirmations (one per timeline). Null while loading. */
  const [todayAffirmations, setTodayAffirmations] = useState<TodayAffirmationItem[] | null>(null);
  /** Signed-in: timeline ID whose Affirm is currently in progress. */
  const [affirmLoadingId, setAffirmLoadingId] = useState<string | null>(null);
  /** Dev only: completed/skipped per timeline for next-action cards. */
  const [devNextActionProgress, setDevNextActionProgress] = useState<
    Record<string, { completed: number[]; skipped: number[] }>
  >({});
  /** Signed-in: all recent timelines (for next-action cards). */
  const [recentTimelines, setRecentTimelines] = useState<SavedTimeline[] | null>(null);
  /** Signed-in: progress (completed/skipped) per timeline from AsyncStorage. */
  const [progressByTimelineId, setProgressByTimelineId] = useState<
    Record<string, { completed: number[]; skipped: number[] }>
  >({});

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

  const fetchRecentTimelinesAndAffirmations = useCallback(async () => {
    if (!user || !session) return;
    try {
      const { data: timelines, error: timelinesError } = await supabase
        .from('action_timeline_generations')
        .select('id, outcome, created_at, actions, timeline_affirmations')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (timelinesError || !timelines?.length) {
        setLatestTimeline(null);
        setRecentTimelines(null);
        setProgressByTimelineId({});
        setTodayAffirmations([]);
        return;
      }

      const asSaved: SavedTimeline[] = timelines.map((t) => ({
        id: t.id,
        user_id: user.id,
        outcome: t.outcome,
        context: '',
        timeframe: 0,
        actions: t.actions ?? [],
        timeline_affirmations: t.timeline_affirmations ?? [],
        summary: {},
        credits_used: 0,
        created_at: t.created_at,
      }));

      setRecentTimelines(asSaved);
      setLatestTimeline(asSaved[0]);

      const progressResults = await Promise.all(
        asSaved.map((t) => getProgress(t.id))
      );
      const progressMap: Record<string, { completed: number[]; skipped: number[] }> = {};
      asSaved.forEach((t, i) => {
        const p = progressResults[i];
        progressMap[t.id] = { completed: p.completed, skipped: p.skipped };
      });
      setProgressByTimelineId(progressMap);

      const results = await Promise.all(
        timelines.map((t) =>
          apiGet(`/api/today-affirmation/${t.id}`, session).then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              return {
                timelineId: t.id,
                outcome: t.outcome,
                affirmationText: data.affirmation_text ?? DEFAULT_AFFIRMATION,
                imageUrl: data.image_url ?? null,
                affirmed: data.affirmed === true,
                affirmationIndex: data.affirmation_index ?? 0,
              };
            }
            const fallback =
              t.timeline_affirmations?.[0] ?? DEFAULT_AFFIRMATION;
            return {
              timelineId: t.id,
              outcome: t.outcome,
              affirmationText: fallback,
              imageUrl: null,
              affirmed: false,
              affirmationIndex: 0,
            };
          })
        )
      );

      setTodayAffirmations(results);
    } catch {
      setLatestTimeline(null);
      setRecentTimelines(null);
      setProgressByTimelineId({});
      setTodayAffirmations([]);
    }
  }, [user, session]);

  useEffect(() => {
    if (useDevHomeData) {
      return;
    }
    fetchProfile();
    fetchLevel();
    fetchRecentTimelinesAndAffirmations();
  }, [fetchProfile, fetchLevel, fetchRecentTimelinesAndAffirmations, useDevHomeData]);

  useEffect(() => {
    if (useDevHomeData || invalidateAt <= 0) {
      return;
    }
    fetchLevel();
    fetchProfile();
  }, [invalidateAt, fetchLevel, fetchProfile, useDevHomeData]);

  /** When returning to Home (e.g. from timeline detail), refetch timelines, progress, and today's affirmations so everything stays in sync. */
  useFocusEffect(
    useCallback(() => {
      if (useDevHomeData || !user || !session) return;
      fetchRecentTimelinesAndAffirmations();
    }, [useDevHomeData, user, session, fetchRecentTimelinesAndAffirmations])
  );

  const handleAffirmForTimeline = useCallback(
    async (timelineId: string, affirmationIndexVal: number, affirmationTextVal: string) => {
      if (!session) return;
      setAffirmLoadingId(timelineId);
      try {
        const res = await apiPost(
          '/api/affirm',
          session,
          {
            generation_id: timelineId,
            affirmation_index: affirmationIndexVal,
            affirmation_text: affirmationTextVal,
          }
        );
        if (res.ok) {
          setTodayAffirmations((prev) =>
            prev
              ? prev.map((item) =>
                  item.timelineId === timelineId
                    ? { ...item, affirmed: true }
                    : item
                )
              : prev
          );
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
        // keep previous state
      } finally {
        setAffirmLoadingId(null);
      }
    },
    [session, setLevelUp, invalidate]
  );

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
    const single = todayAffirmations?.length === 1 ? todayAffirmations[0] : null;
    if (single) {
      await handleAffirmForTimeline(
        single.timelineId,
        single.affirmationIndex,
        single.affirmationText
      );
      return;
    }
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
    affirmed,
    todayAffirmations,
    handleAffirmForTimeline,
    setLevelUp,
    invalidate,
  ]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Swipeable card (poster-only swipe, fixed Affirm/Share, one-page-per-swipe) for both dev and signed-in when 2+ affirmations
  const showSwipeableAffirmations =
    (useDevHomeData &&
      mockData?.todayAffirmations &&
      mockData.todayAffirmations.length > 1) ||
    (!useDevHomeData &&
      todayAffirmations !== null &&
      todayAffirmations.length > 1);

  const carouselData: TodayAffirmationItem[] = showSwipeableAffirmations
    ? useDevHomeData
      ? mockData!.todayAffirmations
      : todayAffirmations!
    : [];

  const carouselDataForCard = useMemo(
    () =>
      useDevHomeData && carouselData.length
        ? carouselData.map((item) => ({
            ...item,
            affirmed:
              item.affirmed || affirmedTimelineIdsDev.includes(item.timelineId),
          }))
        : carouselData,
    [carouselData, useDevHomeData, affirmedTimelineIdsDev]
  );

  /** Dev: next-action items derived from mock data + local complete/skip state. */
  const devNextActionItems = useMemo((): NextActionItem[] => {
    if (!useDevHomeData || !mockData?.recentTimelinesWithNextActions) return [];
    return mockData.recentTimelinesWithNextActions
      .map((item) => {
        const progress = devNextActionProgress[item.timeline.id];
        const completed = progress?.completed ?? item.completed;
        const skipped = progress?.skipped ?? item.skipped;
        return getNextActionItem(item.timeline, completed, skipped);
      })
      .filter((x): x is NextActionItem => x != null);
  }, [useDevHomeData, mockData?.recentTimelinesWithNextActions, devNextActionProgress]);

  const handleDevNextActionToggleComplete = useCallback((timelineId: string, actionIndex: number) => {
    setDevNextActionProgress((prev) => {
      const cur = prev[timelineId] ?? { completed: [], skipped: [] };
      const completed = cur.completed.includes(actionIndex)
        ? cur.completed.filter((i) => i !== actionIndex)
        : [...cur.completed, actionIndex];
      return { ...prev, [timelineId]: { ...cur, completed } };
    });
  }, []);

  const handleDevNextActionSkip = useCallback((timelineId: string, actionIndex: number) => {
    setDevNextActionProgress((prev) => {
      const cur = prev[timelineId] ?? { completed: [], skipped: [] };
      const skipped = cur.skipped.includes(actionIndex)
        ? cur.skipped
        : [...cur.skipped, actionIndex];
      return { ...prev, [timelineId]: { ...cur, skipped } };
    });
  }, []);

  /** Signed-in: next-action items from recentTimelines + progressByTimelineId. */
  const realNextActionItems = useMemo((): NextActionItem[] => {
    if (useDevHomeData || !recentTimelines?.length) return [];
    return recentTimelines
      .map((timeline) => {
        const progress = progressByTimelineId[timeline.id];
        const completed = progress?.completed ?? [];
        const skipped = progress?.skipped ?? [];
        return getNextActionItem(timeline, completed, skipped);
      })
      .filter((x): x is NextActionItem => x != null);
  }, [useDevHomeData, recentTimelines, progressByTimelineId]);

  const handleRealNextActionToggleComplete = useCallback(
    async (timelineId: string, actionIndex: number) => {
      const cur = progressByTimelineId[timelineId] ?? { completed: [], skipped: [] };
      const completed = cur.completed.includes(actionIndex)
        ? cur.completed.filter((i) => i !== actionIndex)
        : [...cur.completed, actionIndex];
      setProgressByTimelineId((prev) => ({
        ...prev,
        [timelineId]: { ...cur, completed },
      }));
      await saveProgress(timelineId, { completed });
    },
    [progressByTimelineId]
  );

  const handleRealNextActionSkip = useCallback(
    async (timelineId: string, actionIndex: number) => {
      const cur = progressByTimelineId[timelineId] ?? { completed: [], skipped: [] };
      const skipped = cur.skipped.includes(actionIndex)
        ? cur.skipped
        : [...cur.skipped, actionIndex];
      setProgressByTimelineId((prev) => ({
        ...prev,
        [timelineId]: { ...cur, skipped },
      }));
      await saveProgress(timelineId, { skipped });
    },
    [progressByTimelineId]
  );

  const handleDevCarouselAffirm = useCallback((timelineId: string) => {
    setAffirmedTimelineIdsDev((prev) =>
      prev.includes(timelineId) ? prev : [...prev, timelineId]
    );
  }, []);

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

        {showSwipeableAffirmations ? (
          <SwipeableAffirmationCard
            items={carouselDataForCard}
            date={todayFormatted}
            onAffirm={(item) => {
              if (useDevHomeData) {
                handleDevCarouselAffirm(item.timelineId);
              } else {
                handleAffirmForTimeline(
                  item.timelineId,
                  item.affirmationIndex,
                  item.affirmationText
                );
              }
            }}
            onShare={() => {}}
            affirmLoadingId={useDevHomeData ? undefined : affirmLoadingId}
          />
        ) : !useDevHomeData && todayAffirmations === null ? (
          <View style={styles.affirmationLoading}>
            <ActivityIndicator size="small" color={glassColors.primary} />
            <Text style={styles.affirmationLoadingText}>Loading affirmations…</Text>
          </View>
        ) : (useDevHomeData && mockData?.latestTimeline && !showSwipeableAffirmations) ||
          (!useDevHomeData && todayAffirmations?.length === 1) ? (
          (() => {
            const single = useDevHomeData
              ? {
                  text: mockData!.affirmationText,
                  imageUrl: null as string | null,
                  affirmed: mockData!.affirmed,
                  onAffirm: handleAffirm,
                  timelineId: mockData!.latestTimeline.id,
                }
              : {
                  text: todayAffirmations![0].affirmationText,
                  imageUrl: todayAffirmations![0].imageUrl,
                  affirmed: todayAffirmations![0].affirmed,
                  onAffirm: () =>
                    handleAffirmForTimeline(
                      todayAffirmations![0].timelineId,
                      todayAffirmations![0].affirmationIndex,
                      todayAffirmations![0].affirmationText
                    ),
                  timelineId: todayAffirmations![0].timelineId,
                };
            return (
              <AffirmationCard
                text={single.text}
                date={todayFormatted}
                affirmed={single.affirmed}
                onAffirm={single.onAffirm}
                imageUrl={single.imageUrl}
                affirmLoading={
                  !useDevHomeData && affirmLoadingId === single.timelineId
                }
                onShare={() => {}}
              />
            );
          })()
        ) : !useDevHomeData && todayAffirmations?.length === 0 ? (
          <GlassCard>
            <Text style={styles.noAffirmationTitle}>No daily affirmation yet</Text>
            <Text style={styles.noAffirmationBody}>
              Generate your first cosmic timeline on the Generate tab to unlock
              personalized daily affirmations.
            </Text>
            <View style={styles.noAffirmationActions}>
              <GlassButton
                title="Create timeline"
                onPress={() =>
                  router.push({ pathname: '/modal', params: { type: 'create-timeline' } })
                }
                accessibilityLabel="Create your first timeline"
                accessibilityHint="Opens the timeline creation form"
              />
            </View>
          </GlassCard>
        ) : (
          <GlassCard>
            <Text style={styles.noAffirmationTitle}>No daily affirmation yet</Text>
            <Text style={styles.noAffirmationBody}>
              Generate your first cosmic timeline on the Generate tab to unlock
              personalized daily affirmations.
            </Text>
            <View style={styles.noAffirmationActions}>
              <GlassButton
                title="Create timeline"
                onPress={() =>
                  router.push({ pathname: '/modal', params: { type: 'create-timeline' } })
                }
                accessibilityLabel="Create your first timeline"
                accessibilityHint="Opens the timeline creation form"
              />
            </View>
          </GlassCard>
        )}

        {(useDevHomeData && devNextActionItems.length > 0) ||
        (!useDevHomeData && realNextActionItems.length > 0) ? (
          <View style={styles.nextActionsSection}>
            <Text style={styles.nextActionsSectionTitle}>Your next actions</Text>
            <Text style={styles.nextActionsSectionSubtitle}>
              One card per timeline — complete or skip to advance
            </Text>
            {(useDevHomeData ? devNextActionItems : realNextActionItems).map(
              (item) => (
                <NextActionCard
                  key={item.timeline.id}
                  timelineId={item.timeline.id}
                  outcome={item.timeline.outcome}
                  action={item.nextAction}
                  actionIndex={item.nextActionOriginalIndex}
                  completed={item.completed.includes(item.nextActionOriginalIndex)}
                  onToggleComplete={() =>
                    useDevHomeData
                      ? handleDevNextActionToggleComplete(
                          item.timeline.id,
                          item.nextActionOriginalIndex
                        )
                      : handleRealNextActionToggleComplete(
                          item.timeline.id,
                          item.nextActionOriginalIndex
                        )
                  }
                  onSkip={() =>
                    useDevHomeData
                      ? handleDevNextActionSkip(
                          item.timeline.id,
                          item.nextActionOriginalIndex
                        )
                      : handleRealNextActionSkip(
                          item.timeline.id,
                          item.nextActionOriginalIndex
                        )
                  }
                  onViewTimeline={() =>
                    router.push({
                      pathname: '/timeline/[id]',
                      params: { id: item.timeline.id },
                    })
                  }
                  pulse
                  reduceMotion={false}
                />
              )
            )}
          </View>
        ) : !useDevHomeData && latestTimeline ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/timeline/[id]',
                params: { id: latestTimeline.id },
              })
            }
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
        ) : null}
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
  noAffirmationTitle: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.sm,
  },
  noAffirmationBody: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.md,
  },
  noAffirmationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  affirmationLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: glassSpacing.xl,
    gap: glassSpacing.sm,
  },
  affirmationLoadingText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
  nextActionsSection: {
    gap: glassSpacing.md,
  },
  nextActionsSectionTitle: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  nextActionsSectionSubtitle: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.xs,
  },
});

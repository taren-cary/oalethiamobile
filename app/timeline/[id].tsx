import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShare } from '@/contexts/ShareContext';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AffirmationCard } from '@/components/affirmation-card';
import { GlassCard } from '@/components/glass';
import { TimelineActionCard } from '@/components/timeline-action-card';
import type { TimelineActionLink } from '@/components/timeline-action-card';
import { NextActionCard } from '@/components/next-action-card/NextActionCard';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLevelUp } from '@/contexts/LevelUpContext';
import { usePointsRefresh } from '@/contexts/PointsRefreshContext';
import { apiGet, apiPost } from '@/lib/api';
import { getProgress, saveProgress } from '@/lib/progress-storage';
import { getNextActionItem } from '@/lib/homeUtils';
import { supabase } from '@/lib/supabase';
import type { SavedTimeline, TimelineAction } from '@/types/timeline';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

function mapActionToLinks(action: TimelineAction): TimelineActionLink[] {
  const links: TimelineActionLink[] = [];
  action.articles?.forEach((a) => links.push({ title: a.title, url: a.url }));
  return links;
}

function mapActionStrategy(action: TimelineAction): string | undefined {
  if (action.strategy) return action.strategy;
  if (action.strategies?.length) return action.strategies.join('\n\n');
  return undefined;
}

export default function TimelineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { setShare } = useShare();
  const { setLevelUp } = useLevelUp();
  const { invalidate } = usePointsRefresh();
  const { isFree } = useSubscription();

  const [timeline, setTimeline] = useState<SavedTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<number[]>([]);
  const [skippedActions, setSkippedActions] = useState<number[]>([]);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [affirmationText, setAffirmationText] = useState('');
  const [affirmationImageUrl, setAffirmationImageUrl] = useState<string | null>(null);
  const [affirmed, setAffirmed] = useState(false);
  const [affirmLoading, setAffirmLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    if (!id || !user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('action_timeline_generations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setTimeline(data);
      if (data?.timeline_affirmations?.length) {
        setAffirmationText(data.timeline_affirmations[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const loadProgress = useCallback(async () => {
    if (!id) return;
    if (session) {
      try {
        const res = await apiGet(`/api/action-progress/${id}`, session);
        if (res.ok) {
          const data = await res.json();
          const progress: Array<{ action_index: number; completed: boolean; skipped: boolean }> =
            data.progress ?? [];
          const completed = progress.filter((p) => p.completed).map((p) => p.action_index);
          const skipped = progress.filter((p) => p.skipped).map((p) => p.action_index);
          setCompletedActions(completed);
          setSkippedActions(skipped);
          await saveProgress(id, { completed, skipped });
          const p = await getProgress(id);
          setAffirmationIndex(p.affirmationIndex);
          const today = new Date().toDateString();
          setAffirmed(p.affirmedDate === today);
          return;
        }
      } catch {
        // fall through to local
      }
    }
    const p = await getProgress(id);
    setCompletedActions(p.completed);
    setSkippedActions(p.skipped);
    setAffirmationIndex(p.affirmationIndex);
    const today = new Date().toDateString();
    setAffirmed(p.affirmedDate === today);
  }, [id, session]);

  const loadTodayAffirmation = useCallback(async () => {
    if (!id || !session) return;
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await apiGet(
        `/api/today-affirmation/${id}?tz=${encodeURIComponent(timeZone)}`,
        session
      );
      if (!res.ok) return;
      const data = await res.json();
      setAffirmationIndex(data.affirmation_index ?? 0);
      setAffirmationText(data.affirmation_text ?? '');
      setAffirmed(data.affirmed === true);
      setAffirmationImageUrl(data.image_url ?? null);
    } catch {
      setAffirmationImageUrl(null);
      if (timeline?.timeline_affirmations?.length) {
        const idx = affirmationIndex % timeline.timeline_affirmations.length;
        setAffirmationText(timeline.timeline_affirmations[idx]);
      }
    }
  }, [id, session, timeline?.timeline_affirmations, affirmationIndex]);

  useEffect(() => {
    loadTimeline();
    loadProgress();
  }, [loadTimeline, loadProgress]);

  useEffect(() => {
    if (timeline && user && session) loadTodayAffirmation();
  }, [timeline, user, session, loadTodayAffirmation]);

  useEffect(() => {
    if (timeline?.timeline_affirmations?.length && !affirmationText) {
      setAffirmationText(timeline.timeline_affirmations[affirmationIndex] ?? '');
    }
  }, [timeline, affirmationIndex, affirmationText]);

  const toggleComplete = useCallback(
    async (index: number) => {
      const next = completedActions.includes(index)
        ? completedActions.filter((i) => i !== index)
        : [...completedActions, index];
      setCompletedActions(next);
      await saveProgress(id!, { completed: next });
      if (session && id) {
        try {
          const res = await apiPost(
            '/api/action-progress',
            session,
            {
              generationId: id,
              actionIndex: index,
              completed: next.includes(index),
              skipped: false,
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
          // keep local state; points may not have been awarded
        }
      }
    },
    [id, session, completedActions, setLevelUp, invalidate]
  );

  const skipAction = useCallback(
    async (index: number) => {
      const next = [...skippedActions, index];
      setSkippedActions(next);
      await saveProgress(id!, { skipped: next });
      if (session && id) {
        try {
          await apiPost(
            '/api/action-progress',
            session,
            {
              generationId: id,
              actionIndex: index,
              completed: false,
              skipped: true,
            }
          );
        } catch {
          // keep local state
        }
      }
    },
    [id, session, skippedActions]
  );

  const handleAffirm = useCallback(async () => {
    if (!session || !id || affirmLoading) return;
    setAffirmLoading(true);
    const today = new Date().toDateString();
    setAffirmed(true);
    saveProgress(id, {
      affirmationIndex,
      affirmationDate: today,
      affirmedDate: today,
    });

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await apiPost('/api/affirm', session, {
        generation_id: id,
        affirmation_index: affirmationIndex,
        affirmation_text:
          affirmationText || timeline?.timeline_affirmations?.[affirmationIndex],
        tz: timeZone,
      });
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
      // already marked affirmed locally
    } finally {
      setAffirmLoading(false);
    }
  }, [id, session, affirmationIndex, affirmationText, timeline, affirmLoading, setLevelUp, invalidate]);

  const visibleActions =
    timeline?.actions?.filter((_, i) => !skippedActions.includes(i)) ?? [];

  const nextActionForCard = useMemo(() => {
    if (!timeline) return null;
    return getNextActionItem(timeline, completedActions, skippedActions);
  }, [timeline, completedActions, skippedActions]);
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={glassColors.primary} />
        <Text style={styles.loadingText}>Loading timeline…</Text>
      </View>
    );
  }

  if (error || !timeline) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <GlassCard>
          <Text style={styles.errorText}>{error ?? 'Timeline not found'}</Text>
          <Text
            style={styles.backLink}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back to Logs"
          >
            Back to Logs
          </Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: glassSpacing.md,
          paddingBottom: insets.bottom + glassSpacing.xxl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.outcomeBlock}>
        <Text style={styles.outcomeLabel}>Goal</Text>
        <Text style={styles.outcomeText}>{timeline.outcome}</Text>
      </View>

      {nextActionForCard && (
        <NextActionCard
          timelineId={timeline.id}
          outcome={timeline.outcome}
          action={nextActionForCard.nextAction}
          actionIndex={nextActionForCard.nextActionOriginalIndex}
          completed={nextActionForCard.completed.includes(
            nextActionForCard.nextActionOriginalIndex
          )}
          onToggleComplete={() =>
            toggleComplete(nextActionForCard.nextActionOriginalIndex)
          }
          onSkip={() => skipAction(nextActionForCard.nextActionOriginalIndex)}
          onViewTimeline={() => {}}
          pulse
          reduceMotion={false}
          showOutcomeLabel={false}
          showViewTimelineButton={false}
        />
      )}

      {!isFree &&
        timeline.actions.map((action, index) => {
          if (skippedActions.includes(index)) return null;
          return (
            <TimelineActionCard
              key={index}
              date={action.date}
              action={action.action}
              transit={action.transit}
              strategy={mapActionStrategy(action)}
              links={mapActionToLinks(action).length > 0 ? mapActionToLinks(action) : undefined}
              completed={completedActions.includes(index)}
              onToggleComplete={() => toggleComplete(index)}
              onSkip={skipAction ? () => skipAction(index) : undefined}
              staggerIndex={index}
              reduceMotion={false}
            />
          );
        })}
      {isFree && timeline.actions.length > 0 && (
        <GlassCard>
          <Text style={styles.lockedTitle}>Full action timeline</Text>
          <Text style={styles.lockedBody}>
            Free users see the next action only. Upgrade to Premium to unlock all timeline actions
            and detailed strategies.
          </Text>
          <Text
            style={styles.lockedCta}
            onPress={() => router.push({ pathname: '/modal', params: { type: 'subscription' } })}
          >
            Upgrade to Premium
          </Text>
        </GlassCard>
      )}

      {affirmationText ? (
        <View style={styles.affirmationSection}>
          <AffirmationCard
            text={affirmationText}
            date={todayFormatted}
            affirmed={affirmed}
            imageUrl={affirmationImageUrl}
            onAffirm={handleAffirm}
            onShare={() => {
              /* Poster image is captured and shared by AffirmationCard */
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: glassSpacing.screenPadding,
    gap: glassSpacing.sectionGap,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: glassColors.background.primary,
  },
  loadingText: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginTop: glassSpacing.md,
  },
  errorText: {
    ...glassTypography.body,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.md,
  },
  backLink: {
    ...glassTypography.label,
    color: glassColors.accent,
  },
  outcomeBlock: {
    marginBottom: glassSpacing.sm,
  },
  outcomeLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 4,
  },
  outcomeText: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  affirmationSection: {
    gap: glassSpacing.md,
  },
  lockedTitle: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.xs,
  },
  lockedBody: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.sm,
  },
  lockedCta: {
    ...glassTypography.label,
    color: glassColors.accent,
  },
});

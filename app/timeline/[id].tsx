import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShare } from '@/contexts/ShareContext';
import React, { useCallback, useEffect, useState } from 'react';
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
import { ShareButton } from '@/components/share-button';
import { TimelineActionCard } from '@/components/timeline-action-card';
import type { TimelineActionLink } from '@/components/timeline-action-card';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import { getProgress, saveProgress } from '@/lib/progress-storage';
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

  const [timeline, setTimeline] = useState<SavedTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<number[]>([]);
  const [skippedActions, setSkippedActions] = useState<number[]>([]);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [affirmationText, setAffirmationText] = useState('');
  const [affirmed, setAffirmed] = useState(false);
  const [affirmLoading, setAffirmLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    if (!id || !user) return;
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
    const p = await getProgress(id);
    setCompletedActions(p.completed);
    setSkippedActions(p.skipped);
    setAffirmationIndex(p.affirmationIndex);
    const today = new Date().toDateString();
    setAffirmed(p.affirmedDate === today);
  }, [id]);

  const loadTodayAffirmation = useCallback(async () => {
    if (!id || !session) return;
    try {
      const res = await apiGet(`/api/today-affirmation/${id}`, session);
      if (!res.ok) return;
      const data = await res.json();
      setAffirmationIndex(data.affirmation_index ?? 0);
      setAffirmationText(data.affirmation_text ?? '');
      setAffirmed(data.affirmed === true);
    } catch {
      // use timeline_affirmations as fallback
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
    (index: number) => {
      const next = completedActions.includes(index)
        ? completedActions.filter((i) => i !== index)
        : [...completedActions, index];
      setCompletedActions(next);
      saveProgress(id!, { completed: next });
    },
    [id, completedActions]
  );

  const skipAction = useCallback(
    (index: number) => {
      const next = [...skippedActions, index];
      setSkippedActions(next);
      saveProgress(id!, { skipped: next });
    },
    [id, skippedActions]
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
      const res = await apiPost(
        '/api/affirm',
        session,
        {
          generation_id: id,
          affirmation_index: affirmationIndex,
          affirmation_text: affirmationText || timeline?.timeline_affirmations?.[affirmationIndex],
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.levelUp) {
          // Phase 6 can show level-up modal; here we just continue
        }
      }
    } catch {
      // already marked affirmed locally
    } finally {
      setAffirmLoading(false);
    }
  }, [id, session, affirmationIndex, affirmationText, timeline, affirmLoading]);

  const visibleActions =
    timeline?.actions?.filter((_, i) => !skippedActions.includes(i)) ?? [];
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

      {timeline.actions.map((action, index) => {
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

      {affirmationText ? (
        <View style={styles.affirmationSection}>
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
          <View style={styles.shareRow}>
            <ShareButton
              shareMessage={affirmationText}
              shareTitle="Today's affirmation"
              accessibilityLabel="Share affirmation"
            />
          </View>
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
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});

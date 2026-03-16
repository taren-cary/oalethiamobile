import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AffirmationCard } from '@/components/affirmation-card';
import { CountdownTimer } from '@/components/CountdownTimer';
import { GlassButton } from '@/components/glass';
import { TimelineActionCard } from '@/components/timeline-action-card';
import type { TimelineActionLink } from '@/components/timeline-action-card';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerationResult } from '@/contexts/GenerationResultContext';
import { useLevelUp } from '@/contexts/LevelUpContext';
import { usePointsRefresh } from '@/contexts/PointsRefreshContext';
import {
  DEFAULT_IMAGE_COUNT_PER_CONTEXT,
  normalizeLifeContext,
} from '@/lib/affirmationLifeContexts';
import { parseActionDate } from '@/lib/parseActionDate';
import { apiPost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { TimelineAction } from '@/types/timeline';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

function mapActionToLinks(action: TimelineAction): TimelineActionLink[] {
  const links: TimelineActionLink[] = [];
  action.articles?.forEach((a) => links.push({ title: a.title, url: a.url }));
  return links;
}

function mapStrategy(action: TimelineAction): string | undefined {
  if (action.strategy) return action.strategy;
  if (action.strategies?.length) return action.strategies.join('\n\n');
  return undefined;
}

export function ResultsModalContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { result, clearResult } = useGenerationResult();
  const { setLevelUp } = useLevelUp();
  const { invalidate } = usePointsRefresh();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [affirmed, setAffirmed] = useState(false);
  const [affirmLoading, setAffirmLoading] = useState(false);
  const [completedActions, setCompletedActions] = useState<number[]>([]);
  const [skippedActions, setSkippedActions] = useState<number[]>([]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleAffirm = useCallback(async () => {
    if (!session || !result || affirmLoading) return;
    setAffirmLoading(true);
    setAffirmed(true);
    try {
      const text = result.timelineAffirmations[0] ?? '';
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await apiPost('/api/affirm', session, {
        generation_id: result.tempGenerationId,
        affirmation_index: 0,
        affirmation_text: text,
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
      // keep affirmed locally
    } finally {
      setAffirmLoading(false);
    }
  }, [session, result, affirmLoading, setLevelUp, invalidate]);

  const handleSave = useCallback(async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const lifeContext = normalizeLifeContext(result.life_context);
      const { data: savedTimeline, error } = await supabase
        .from('action_timeline_generations')
        .insert({
          user_id: user.id,
          outcome: result.outcome,
          context: result.context || '',
          timeframe: result.timeframe,
          actions: result.actions,
          timeline_affirmations: result.timelineAffirmations,
          summary: result.summary,
          credits_used: 1,
          life_context: lifeContext,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const today = new Date();
      const imageCount = DEFAULT_IMAGE_COUNT_PER_CONTEXT;
      const dailyAffirmations = result.timelineAffirmations.slice(0, 30).map((text, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return {
          user_id: user.id,
          timeline_id: savedTimeline.id,
          affirmation_index: i,
          affirmation_text: text,
          date: d.toISOString().split('T')[0],
          affirmed: false,
          points_awarded: 0,
          image_index: i % imageCount,
        };
      });
      await supabase.from('daily_affirmations').insert(dailyAffirmations);
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }, [user, result]);

  const handleViewInLogs = useCallback(() => {
    clearResult();
    router.back();
    router.push('/(tabs)/logs');
  }, [clearResult, router]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearResult();
    router.back();
  }, [clearResult, router]);

  if (!result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>No results</Text>
        <GlassButton title="Close" onPress={handleClose} accessibilityLabel="Close" />
      </View>
    );
  }

  const affirmationText = result.timelineAffirmations[0] ?? '';

  // Mirror web logic: visible actions exclude skipped; next action is first incomplete among them.
  const visibleActions = result.actions.filter(
    (_, index) => !skippedActions.includes(index)
  );

  const nextActionIndex = visibleActions.findIndex(
    (_, index) =>
      !completedActions.includes(result.actions.indexOf(visibleActions[index]))
  );

  const nextAction =
    nextActionIndex >= 0 ? visibleActions[nextActionIndex] : null;
  const nextActionOriginalIndex = nextAction
    ? result.actions.indexOf(nextAction)
    : -1;
  const nextActionTargetDate = nextAction
    ? parseActionDate(nextAction.date)
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your timeline is ready</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.outcomeBlock}>
          <Text style={styles.outcomeLabel}>Goal</Text>
          <Text style={styles.outcomeText}>{result.outcome}</Text>
          <Text style={styles.aiNote}>This is AI generated content.</Text>
        </View>

        {nextAction && nextActionTargetDate && (
          <View style={styles.nextActionBlock}>
            <View style={styles.nextActionHeaderRow}>
              <Text style={styles.nextActionLabel}>Next action</Text>
              <CountdownTimer targetDate={nextActionTargetDate} compact />
            </View>
            <View style={styles.actionCardWrapper}>
              <TimelineActionCard
                date={nextAction.date}
                action={nextAction.action}
                transit={nextAction.transit}
                strategy={mapStrategy(nextAction)}
                links={
                  mapActionToLinks(nextAction).length > 0
                    ? mapActionToLinks(nextAction)
                    : undefined
                }
                completed={completedActions.includes(nextActionOriginalIndex)}
                onToggleComplete={() => {
                  const idx = nextActionOriginalIndex;
                  const next = completedActions.includes(idx)
                    ? completedActions.filter((i) => i !== idx)
                    : [...completedActions, idx];
                  setCompletedActions(next);
                }}
                onSkip={() =>
                  setSkippedActions((s) => [...s, nextActionOriginalIndex])
                }
                staggerIndex={0}
                reduceMotion={false}
              />
            </View>
          </View>
        )}

        {result.actions.slice(0, 5).map((action, index) => {
          if (skippedActions.includes(index)) return null;
          // Skip rendering the next action again in the list.
          if (nextAction && index === nextActionOriginalIndex) return null;
          return (
            <View key={index} style={styles.actionCardWrapper}>
              <TimelineActionCard
                date={action.date}
                action={action.action}
                transit={action.transit}
                strategy={mapStrategy(action)}
                links={
                  mapActionToLinks(action).length > 0
                    ? mapActionToLinks(action)
                    : undefined
                }
                completed={completedActions.includes(index)}
                onToggleComplete={() => {
                  const next = completedActions.includes(index)
                    ? completedActions.filter((i) => i !== index)
                    : [...completedActions, index];
                  setCompletedActions(next);
                }}
                onSkip={() => setSkippedActions((s) => [...s, index])}
                staggerIndex={index}
                reduceMotion={false}
              />
            </View>
          );
        })}
        {result.actions.length > 5 && (
          <Text style={styles.moreText}>+{result.actions.length - 5} more actions when saved</Text>
        )}

        {affirmationText ? (
          <AffirmationCard
            text={affirmationText}
            date={todayFormatted}
            affirmed={affirmed}
            onAffirm={handleAffirm}
            onShare={() => {
              /* Poster image is captured and shared by AffirmationCard */
            }}
          />
        ) : null}

        <GlassButton
          title={saving ? 'Saving…' : saved ? 'Saved!' : 'Save timeline'}
          onPress={handleSave}
          disabled={saving || saved}
          style={styles.button}
          accessibilityLabel={saved ? 'Saved' : 'Save timeline'}
        />
        {saved && (
          <GlassButton
            title="View in Logs"
            onPress={handleViewInLogs}
            style={styles.button}
            accessibilityLabel="View in Logs"
          />
        )}
        <GlassButton title="Close" onPress={handleClose} variant="secondary" accessibilityLabel="Close" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
  header: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingVertical: glassSpacing.md,
  },
  title: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingBottom: glassSpacing.xxl,
  },
  outcomeBlock: {
    marginBottom: glassSpacing.lg,
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
  aiNote: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: 6,
  },
  nextActionBlock: {
    marginBottom: glassSpacing.lg,
  },
  nextActionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: glassSpacing.sm,
  },
  nextActionLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.accent,
  },
  actionCardWrapper: {
    marginBottom: glassSpacing.md,
  },
  moreText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.md,
  },
  button: {
    marginBottom: glassSpacing.md,
  },
});

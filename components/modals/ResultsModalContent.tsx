import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AffirmationCard } from '@/components/affirmation-card';
import { GlassButton } from '@/components/glass';
import { TimelineActionCard } from '@/components/timeline-action-card';
import type { TimelineActionLink } from '@/components/timeline-action-card';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerationResult } from '@/contexts/GenerationResultContext';
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
      await apiPost(
        '/api/affirm',
        session,
        {
          generation_id: result.tempGenerationId,
          affirmation_index: 0,
          affirmation_text: text,
        }
      );
    } catch {
      // keep affirmed locally
    } finally {
      setAffirmLoading(false);
    }
  }, [session, result, affirmLoading]);

  const handleSave = useCallback(async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
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
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const today = new Date();
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
        </View>

        {result.actions.slice(0, 5).map((action, index) => {
          if (skippedActions.includes(index)) return null;
          return (
            <TimelineActionCard
              key={index}
              date={action.date}
              action={action.action}
              transit={action.transit}
              strategy={mapStrategy(action)}
              links={mapActionToLinks(action).length > 0 ? mapActionToLinks(action) : undefined}
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
            onShare={() => Share.share({ message: affirmationText, title: "Today's cosmic affirmation" })}
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
  moreText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.md,
  },
  button: {
    marginBottom: glassSpacing.md,
  },
});

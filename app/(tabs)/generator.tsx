import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressHoldGenerateButton } from '@/components/press-hold-generate/PressHoldGenerateButton';
import { GlassButton, GlassCard, GlassTextInput } from '@/components/glass';
import { AffirmationCard } from '@/components/affirmation-card';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TimelineActionCard } from '@/components/timeline-action-card';
import type { TimelineActionLink } from '@/components/timeline-action-card';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerationResult } from '@/contexts/GenerationResultContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLevelUp } from '@/contexts/LevelUpContext';
import { usePointsRefresh } from '@/contexts/PointsRefreshContext';
import { apiPost } from '@/lib/api';
import { parseActionDate } from '@/lib/parseActionDate';
import {
  DEFAULT_IMAGE_COUNT_PER_CONTEXT,
  normalizeLifeContext,
} from '@/lib/affirmationLifeContexts';
import { supabase } from '@/lib/supabase';
import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';
import type { TimelineAction } from '@/types/timeline';

type Approach = 'conservative' | 'balanced' | 'aggressive';

const TIMEFRAMES = [1, 3, 6, 12] as const;
const APPROACHES: { value: Approach; label: string; desc: string }[] = [
  { value: 'conservative', label: 'Conservative', desc: 'Steady, low-risk steps' },
  { value: 'balanced', label: 'Balanced', desc: 'Mix of steady and bold moves' },
  { value: 'aggressive', label: 'Aggressive', desc: 'Bold, high-impact actions' },
];

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

export default function GeneratorScreen() {
  const router = useRouter();
  const { user, session, isFirstTimeUser } = useAuth();
  const { result, setResult, clearResult } = useGenerationResult();
  const { tier, credits, isFree } = useSubscription();
  const { setLevelUp } = useLevelUp();
  const { invalidate } = usePointsRefresh();
  const insets = useSafeAreaInsets();
  const [outcome, setOutcome] = useState('');
  const [context, setContext] = useState('');
  const [availableResources, setAvailableResources] = useState('');
  const [approach, setApproach] = useState<Approach>('balanced');
  const [timeframe, setTimeframe] = useState(3);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Results display state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [affirmed, setAffirmed] = useState(false);
  const [affirmLoading, setAffirmLoading] = useState(false);
  const [completedActions, setCompletedActions] = useState<number[]>([]);
  const [skippedActions, setSkippedActions] = useState<number[]>([]);

  // Birth data loaded from profile; users don't edit it here.
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showHints, setShowHints] = useState(false);

  const lottieRef = useRef<LottieView | null>(null);

  const paddingBottom = insets.bottom + 100;
  const costPerGeneration = 1;

  // Load first-time generator hints preference per user.
  useEffect(() => {
    if (!user) {
      setShowHints(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const key = `@oalethia/generator_hints_dismissed_${user.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (!cancelled) {
          setShowHints(stored !== 'true');
        }
      } catch {
        if (!cancelled) {
          setShowHints(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dismissHintsForUser = useCallback(async () => {
    if (!user) {
      setShowHints(false);
      return;
    }
    try {
      const key = `@oalethia/generator_hints_dismissed_${user.id}`;
      await AsyncStorage.setItem(key, 'true');
    } catch {
      // ignore
    }
    setShowHints(false);
  }, [user]);

  const handleResetForm = useCallback(() => {
    const hasContent = outcome.trim() || context.trim() || availableResources.trim();
    
    if (hasContent) {
      Alert.alert(
        'Reset form?',
        'This will clear all your inputs. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reset', 
            style: 'destructive',
            onPress: () => {
              setOutcome('');
              setContext('');
              setAvailableResources('');
              setApproach('balanced');
              setTimeframe(3);
              setFormError('');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        ]
      );
    } else {
      // If empty, just reset without confirmation
      setOutcome('');
      setContext('');
      setAvailableResources('');
      setApproach('balanced');
      setTimeframe(3);
      setFormError('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [outcome, context, availableResources]);

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

  const handleSaveTimeline = useCallback(async () => {
    if (!user || !result) return;
    setSaving(true);
    setSaveError('');
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
          image_sequence: result.image_sequence || null,
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
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, [user, result]);

  const handleGenerateAnother = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearResult();
    setSaved(false);
    setSaveError('');
    setAffirmed(false);
    setCompletedActions([]);
    setSkippedActions([]);
  }, [clearResult]);

  const handleViewInLogs = useCallback(() => {
    clearResult();
    setSaved(false);
    setSaveError('');
    setAffirmed(false);
    setCompletedActions([]);
    setSkippedActions([]);
    router.push('/(tabs)/logs');
  }, [clearResult, router]);

  // Load birth chart for signed-in user (same logic as CreateTimelineModalContent),
  // so we can call /api/generate-timeline without exposing birth fields on this screen.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('birth_charts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled || !data) return;
        if (data.birth_date) {
          setBirthDate(new Date(data.birth_date).toISOString().split('T')[0]);
        }
        if (data.birth_time) setBirthTime(data.birth_time);
        if (data.latitude != null) setLatitude(Number(data.latitude));
        if (data.longitude != null) setLongitude(Number(data.longitude));
      } catch {
        // ignore; we'll validate before generating
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    setFormError('');

    if (!user || !session) {
      setFormError('Please sign in to generate a timeline.');
      return;
    }

    if (!outcome.trim()) {
      setFormError('Please describe what you want to achieve.');
      return;
    }

    if (!birthDate || latitude == null || longitude == null) {
      setFormError(
        'Birth information is incomplete. Please finish onboarding or update your profile in Settings.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost('/api/generate-timeline', session, {
        outcome: outcome.trim(),
        context: context.trim() || undefined,
        availableResources: availableResources.trim() || '',
        preferredApproach: approach,
        timeframe,
        birthDate,
        birthTime: birthTime || '12:00',
        latitude,
        longitude,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data.error || '').toString().toLowerCase();
        if (res.status === 400 && (msg.includes('credit') || msg.includes('insufficient'))) {
          setFormError(
            "You've used all your free credits. Upgrade to Premium or buy credits to generate more timelines."
          );
        } else {
          setFormError(data.error || 'Generation failed. Please try again.');
        }
        return;
      }

      const data = await res.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({
        outcome: outcome.trim(),
        context: context.trim(),
        timeframe,
        actions: (data.actions ?? []) as TimelineAction[],
        timelineAffirmations: data.timelineAffirmations ?? [],
        summary: data.summary ?? {},
        tempGenerationId: data.tempGenerationId ?? '',
        life_context: data.life_context ?? undefined,
        image_sequence: data.image_sequence ?? undefined,
      });
      // Don't navigate to modal - show results inline
      if (showHints) {
        dismissHintsForUser();
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    user,
    session,
    loading,
    outcome,
    context,
    availableResources,
    approach,
    timeframe,
    birthDate,
    birthTime,
    latitude,
    longitude,
    setResult,
    router,
    showHints,
    dismissHintsForUser,
  ]);

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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + glassSpacing.md, paddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>StarManifest™ Generator</Text>

          {session && (
            <GlassCard style={styles.creditsCard}>
              <Text style={styles.creditsTitle}>Cosmic credits</Text>
              <Text style={styles.creditsBody}>
                {typeof credits === 'number'
                  ? `${credits} credit${credits === 1 ? '' : 's'} remaining this month`
                  : 'Loading credits…'}
              </Text>
              <Text style={styles.creditsHint}>
                Each timeline generation uses {costPerGeneration} credit.
              </Text>
              {isFree && tier && (
                <Text style={styles.creditsHint}>
                  Free plan includes {tier.monthlyCredits} credits/month. Upgrade to Premium for
                  more.
                </Text>
              )}
            </GlassCard>
          )}

        {!result && (
          <>
            {showHints && (
          <GlassCard style={styles.formCard}>
            <Text style={styles.promptLabel}>Quick walkthrough</Text>
            <Text style={styles.helperText}>
              1. Goal – Use the outcome field to describe what you want to
              achieve as clearly as possible.
            </Text>
            <Text style={styles.helperText}>
              2. Context – Share your current situation so timelines can match
              your reality.
            </Text>
            <Text style={styles.helperText}>
              3. Resources – List your time, budget, skills, or network so the
              plan fits what you can actually use.
            </Text>
            <Text style={styles.helperText}>
              4. Approach – Choose Conservative, Balanced, or Aggressive to set
              how bold the actions should feel.
            </Text>
            <Text style={styles.helperText}>
              5. Timeframe – Pick how long you want to work toward this goal
              (1, 3, 6 months, or 1 year).
            </Text>
            <Text style={styles.helperText}>
              6. Generate – Press and hold Generate to create your first cosmic
              action timeline.
            </Text>
            <Pressable
              onPress={dismissHintsForUser}
              style={({ pressed }) => [
                styles.hintsDismiss,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Dismiss walkthrough"
            >
              <Text style={styles.hintsDismissText}>Got it</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* ---------- Form (web parity) ---------- */}
        <GlassCard style={styles.formCard}>
          <Text style={styles.promptLabel}>What do you want to achieve? *</Text>
          <GlassTextInput
            value={outcome}
            onChangeText={setOutcome}
            placeholder="e.g., Get promoted, Find a partner, Hit $10k/month"
            maxLength={150}
            accessibilityLabel="Outcome or goal"
            containerStyle={styles.inputTight}
          />
          <Text style={styles.characterCount}>
            {outcome.length}/150 characters
          </Text>
          <Text style={styles.promptLabel}>What's your current situation with this goal?</Text>
          <GlassTextInput
            value={context}
            onChangeText={setContext}
            placeholder="Be specific! e.g. I'm a freelance designer with 2 clients, making $3k/month..."
            maxLength={600}
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 80 }}
            accessibilityLabel="Context"
            containerStyle={styles.inputTight}
          />
          <Text style={styles.characterCount}>
            {context.length}/600 characters
          </Text>
          <Text style={styles.helperText}>
            💡 The more specific you are, the more personalized your action plan will be.
          </Text>
          <Text style={styles.promptLabel}>What resources do you have available?</Text>
          <GlassTextInput
            value={availableResources}
            onChangeText={setAvailableResources}
            placeholder="e.g., 3–4 hours/day, budget $200–300, small network of ~20 contacts"
            maxLength={300}
            accessibilityLabel="Available resources"
            containerStyle={styles.inputTight}
          />
          <Text style={styles.characterCount}>
            {availableResources.length}/300 characters
          </Text>
          <Text style={styles.helperText}>
            💡 Include time, budget, network, skills, or any other resources you can use.
          </Text>

          <Text style={styles.promptLabel}>What's your preferred approach?</Text>
          <View style={[styles.chipRow, styles.chipRowTight]}>
            {APPROACHES.map((a) => (
              <Pressable
                key={a.value}
                onPress={() => { Haptics.selectionAsync(); setApproach(a.value); }}
                style={[styles.chip, approach === a.value && styles.chipActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: approach === a.value }}
                accessibilityLabel={a.label}
              >
                <Text style={[styles.chipText, approach === a.value && styles.chipTextActive]}>{a.label}</Text>
                <Text style={[styles.chipDesc, approach === a.value && styles.chipDescActive]}>{a.desc}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.promptLabel}>Timeframe to achieve this goal</Text>
          <View style={[styles.chipRow, styles.chipRowTight]}>
            {TIMEFRAMES.map((m) => {
              const maxTimeframe = (tier && tier.maxTimeframe) ?? 3;
              const restricted = m > maxTimeframe;
              const label = m === 1 ? '1 Month' : m === 12 ? '1 Year' : `${m} Months`;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    if (restricted) return;
                    Haptics.selectionAsync();
                    setTimeframe(m);
                  }}
                  style={[
                    styles.chip,
                    timeframe === m && styles.chipActive,
                    restricted && styles.chipRestricted,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: timeframe === m, disabled: restricted }}
                  accessibilityLabel={label}
                >
                  <Text
                    style={[
                      styles.chipText,
                      timeframe === m && styles.chipTextActive,
                      restricted && styles.chipTextRestricted,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.helperText}>
            💡 Shorter timeframes create tighter, more focused action plans. Longer ones spread actions out.
          </Text>
          {isFree && tier && tier.maxTimeframe < 12 && (
            <Text style={styles.helperText}>
              Free plan supports timelines up to {tier.maxTimeframe} months. Upgrade to Premium for
              6–12 month timelines.
            </Text>
          )}

          <PressHoldGenerateButton
            onComplete={handleGenerate}
            loading={loading}
          />

          <Pressable
            onPress={handleResetForm}
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Reset form"
          >
            <Text style={styles.resetButtonText}>Reset form</Text>
          </Pressable>

          {formError ? (
            <Text style={styles.errorText}>{formError}</Text>
          ) : null}
        </GlassCard>
          </>
        )}

        {loading && (
          <View style={styles.lottieContainer}>
            <LottieView
              ref={lottieRef}
              source={require('@/assets/OalethiaSquareLogoAnimation.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        )}

        {result && !loading && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Your timeline is ready</Text>
            </View>

            <View style={styles.outcomeBlock}>
              <Text style={styles.outcomeLabel}>Goal</Text>
              <Text style={styles.outcomeText}>{result.outcome}</Text>
              <Text style={styles.aiNote}>This is AI generated content.</Text>
            </View>

            {(() => {
              const todayFormatted = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const affirmationText = result.timelineAffirmations[0] ?? '';
              const visibleActions = result.actions.filter(
                (_, index) => !skippedActions.includes(index)
              );
              const nextActionIndex = visibleActions.findIndex(
                (_, index) =>
                  !completedActions.includes(result.actions.indexOf(visibleActions[index]))
              );
              const nextAction = nextActionIndex >= 0 ? visibleActions[nextActionIndex] : null;
              const nextActionOriginalIndex = nextAction ? result.actions.indexOf(nextAction) : -1;
              const nextActionTargetDate = nextAction ? parseActionDate(nextAction.date) : null;

              return (
                <>
                  {saveError ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorBoxText}>{saveError}</Text>
                    </View>
                  ) : null}
                  
                  <GlassButton
                    title={saving ? 'Saving…' : saved ? 'Saved!' : 'Save timeline'}
                    onPress={handleSaveTimeline}
                    disabled={saving || saved}
                    style={styles.saveButton}
                    accessibilityLabel={saved ? 'Saved' : 'Save timeline'}
                  />

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

                  {!isFree && result.actions.slice(0, 5).map((action, index) => {
                    if (skippedActions.includes(index)) return null;
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
                  {!isFree && result.actions.length > 5 && (
                    <Text style={styles.moreText}>
                      +{result.actions.length - 5} more actions when saved
                    </Text>
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

                  {saved && (
                    <GlassButton
                      title="View in Logs"
                      onPress={handleViewInLogs}
                      style={styles.button}
                      accessibilityLabel="View in Logs"
                    />
                  )}
                  <GlassButton
                    title="Generate another"
                    onPress={handleGenerateAnother}
                    variant="secondary"
                    style={styles.button}
                    accessibilityLabel="Generate another timeline"
                  />
                </>
              );
            })()}
          </>
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
  },
  title: {
    ...glassTypography.h2,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.lg,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: glassSpacing.xl,
  },
  promptLabel: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
    marginBottom: 4,
    marginTop: glassSpacing.sm,
  },
  inputTight: {
    marginBottom: glassSpacing.xs,
  },
  helperText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
    marginTop: 0,
    marginBottom: glassSpacing.xs,
  },
  characterCount: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: glassSpacing.xs,
  },
  errorText: {
    ...glassTypography.bodySmall,
    color: glassColors.error,
    marginTop: glassSpacing.sm,
  },
  label: {
    ...glassTypography.labelSmall,
    color: glassColors.text.primary,
    marginBottom: 4,
    marginTop: glassSpacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  chipRowTight: {
    marginBottom: glassSpacing.xs,
  },
  chip: {
    paddingVertical: glassSpacing.sm,
    paddingHorizontal: glassSpacing.md,
    borderRadius: glassBorderRadius.md,
    backgroundColor: glassColors.glass.light,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.default,
    minHeight: 44,
    justifyContent: 'center',
    minWidth: 90,
  },
  chipActive: {
    borderColor: glassColors.glassBorder.active,
    backgroundColor: glassColors.glass.medium,
  },
  chipText: {
    ...glassTypography.label,
    color: glassColors.text.secondary,
  },
  chipTextActive: {
    color: glassColors.text.primary,
  },
  chipRestricted: {
    opacity: 0.5,
  },
  chipTextRestricted: {
    color: glassColors.text.tertiary,
  },
  chipDesc: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: 2,
  },
  chipDescActive: {
    color: glassColors.text.secondary,
  },
  submitBtn: {
    marginTop: glassSpacing.sm,
    marginBottom: glassSpacing.xs,
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: glassSpacing.xl,
  },
  lottie: {
    width: 180,
    height: 180,
  },
  resultBtnPrimary: {
    marginTop: glassSpacing.lg,
  },
  creditsCard: {
    marginBottom: glassSpacing.lg,
  },
  creditsTitle: {
    ...glassTypography.label,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.xs,
  },
  creditsBody: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
  },
  creditsHint: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: 4,
  },
  hintsDismiss: {
    alignSelf: 'flex-start',
    marginTop: glassSpacing.sm,
    paddingVertical: glassSpacing.xs,
    paddingHorizontal: glassSpacing.sm,
  },
  hintsDismissText: {
    ...glassTypography.bodySmall,
    color: glassColors.accent,
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: glassSpacing.sm,
    paddingHorizontal: glassSpacing.md,
    marginTop: glassSpacing.sm,
  },
  resetButtonText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    textDecorationLine: 'underline',
  },
  resultsHeader: {
    marginBottom: glassSpacing.md,
  },
  resultsTitle: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
    textAlign: 'center',
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
  saveButton: {
    marginBottom: glassSpacing.lg,
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
    textAlign: 'center',
  },
  button: {
    marginBottom: glassSpacing.md,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  errorBoxText: {
    ...glassTypography.bodySmall,
    color: glassColors.error,
    textAlign: 'center',
  },
});

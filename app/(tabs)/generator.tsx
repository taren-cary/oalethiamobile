/**
 * Generate tab – mock dev view.
 * Shows full web form fields + mock results section on one page (no auth required).
 * Replace with real submit/API + real results when implementing.
 */
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AffirmationCard } from '@/components/affirmation-card';
import { PressHoldGenerateButton } from '@/components/press-hold-generate/PressHoldGenerateButton';
import { GlassButton, GlassCard, GlassTextInput } from '@/components/glass';
import { TimelineActionCard } from '@/components/timeline-action-card';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerationResult } from '@/contexts/GenerationResultContext';
import { apiPost } from '@/lib/api';
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

/** Mock result data for dev preview of results section */
const MOCK_ACTIONS = [
  { date: 'Mar 5, 2025', action: 'Set a clear intention for your goal and write it down.', transit: 'Moon in Capricorn', strategy: 'Focus on one outcome.' },
  { date: 'Mar 12, 2025', action: 'Take one small step toward your outcome—research or reach out to one person.', transit: 'Mercury trine Saturn', strategy: 'One action is enough.' },
  { date: 'Mar 19, 2025', action: 'Review progress and adjust your next step based on what you learned.', transit: 'Sun in Pisces', strategy: 'Reflect and refine.' },
];
const MOCK_AFFIRMATION = "I am aligned with the right timing. Each step I take is supported by the cosmos.";
const MOCK_GOAL = "Hit $10,000 per month in revenue";
const MOCK_TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function GeneratorScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { setResult } = useGenerationResult();
  const insets = useSafeAreaInsets();
  const [outcome, setOutcome] = useState('');
  const [context, setContext] = useState('');
  const [availableResources, setAvailableResources] = useState('');
  const [approach, setApproach] = useState<Approach>('balanced');
  const [timeframe, setTimeframe] = useState(3);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Birth data loaded from profile; users don't edit it here.
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const lottieRef = useRef<LottieView | null>(null);

  const paddingBottom = insets.bottom + 100;

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
      });
      // Overwrites any previous unsaved result; if user hadn't saved, it's lost, matching the desired behavior.
      router.push({ pathname: '/modal', params: { type: 'results' } });
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

        {/* ---------- Form (web parity) ---------- */}
        <GlassCard style={styles.formCard}>
          <Text style={styles.promptLabel}>What do you want to achieve? *</Text>
          <GlassTextInput
            value={outcome}
            onChangeText={setOutcome}
            placeholder="e.g., Get promoted, Find a partner, Hit $10k/month"
            accessibilityLabel="Outcome or goal"
            containerStyle={styles.inputTight}
          />
          <Text style={styles.promptLabel}>What's your current situation with this goal?</Text>
          <GlassTextInput
            value={context}
            onChangeText={setContext}
            placeholder="Be specific! e.g. I'm a freelance designer with 2 clients, making $3k/month..."
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 80 }}
            accessibilityLabel="Context"
            containerStyle={styles.inputTight}
          />
          <Text style={styles.helperText}>
            💡 The more specific you are, the more personalized your action plan will be.
          </Text>
          <Text style={styles.promptLabel}>What resources do you have available?</Text>
          <GlassTextInput
            value={availableResources}
            onChangeText={setAvailableResources}
            placeholder="e.g., 3–4 hours/day, budget $200–300, small network of ~20 contacts"
            accessibilityLabel="Available resources"
            containerStyle={styles.inputTight}
          />
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
            {TIMEFRAMES.map((m) => (
              <Pressable
                key={m}
                onPress={() => { Haptics.selectionAsync(); setTimeframe(m); }}
                style={[styles.chip, timeframe === m && styles.chipActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: timeframe === m }}
                accessibilityLabel={m === 12 ? '1 Year' : `${m} Months`}
              >
                <Text style={[styles.chipText, timeframe === m && styles.chipTextActive]}>
                  {m === 1 ? '1 Month' : m === 12 ? '1 Year' : `${m} Months`}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helperText}>
            💡 Shorter timeframes create tighter, more focused action plans. Longer ones spread actions out.
          </Text>

          <PressHoldGenerateButton
            onComplete={handleGenerate}
            loading={loading}
          />

          {formError ? (
            <Text style={styles.errorText}>{formError}</Text>
          ) : null}
        </GlassCard>

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

        {/* ---------- Mock results section (dev preview) ---------- */}
        <View style={styles.mockResults}>
          <Text style={styles.mockResultsTitle}>Results (mock preview)</Text>
          <View style={styles.outcomeBlock}>
            <Text style={styles.outcomeLabel}>Goal</Text>
            <Text style={styles.outcomeText}>{MOCK_GOAL}</Text>
            <Text style={styles.aiNote}>This is AI generated content.</Text>
          </View>

          {MOCK_ACTIONS.map((action, index) => (
            <View key={index} style={styles.actionCardWrapper}>
              <TimelineActionCard
                date={action.date}
                action={action.action}
                transit={action.transit}
                strategy={action.strategy}
                completed={false}
                onToggleComplete={() => {}}
                onSkip={() => {}}
                staggerIndex={index}
                reduceMotion={false}
              />
            </View>
          ))}
          <Text style={styles.moreText}>+2 more actions when saved</Text>

          <AffirmationCard
            text={MOCK_AFFIRMATION}
            date={MOCK_TODAY}
            affirmed={false}
            onAffirm={() => {}}
            onShare={() => {}}
          />

          <GlassButton title="Save timeline" onPress={() => {}} style={[styles.resultBtn, styles.resultBtnPrimary]} accessibilityLabel="Save timeline (mock)" />
          <GlassButton title="Generate another" onPress={() => {}} variant="secondary" accessibilityLabel="Generate another (mock)" />
        </View>
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
  mockResults: {
    paddingTop: glassSpacing.lg,
    paddingBottom: glassSpacing.xxl,
  },
  mockResultsTitle: {
    ...glassTypography.h4,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.md,
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
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: glassSpacing.xl,
  },
  lottie: {
    width: 180,
    height: 180,
  },
  actionCardWrapper: {
    marginBottom: glassSpacing.md,
  },
  moreText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.md,
  },
  resultBtn: {
    marginBottom: glassSpacing.md,
  },
  resultBtnPrimary: {
    marginTop: glassSpacing.lg,
  },
});

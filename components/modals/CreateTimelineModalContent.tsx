import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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

import { GlassButton, GlassCard, GlassTextInput } from '@/components/glass';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerationResult } from '@/contexts/GenerationResultContext';
import { API_BASE_URL, apiGet, apiPost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';
import type { TimelineAction } from '@/types/timeline';

type Approach = 'conservative' | 'balanced' | 'aggressive';

const TIMEFRAMES = [1, 3, 6, 12] as const;
const APPROACHES: { value: Approach; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'aggressive', label: 'Aggressive' },
];

export function CreateTimelineModalContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { setResult } = useGenerationResult();

  const [outcome, setOutcome] = useState('');
  const [context, setContext] = useState('');
  const [timeframe, setTimeframe] = useState(3);
  const [approach, setApproach] = useState<Approach>('balanced');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('birth_charts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (data?.birth_date) {
          setBirthDate(new Date(data.birth_date).toISOString().split('T')[0]);
        }
        if (data?.birth_time) setBirthTime(data.birth_time);
        if (data?.location) setLocation(data.location);
        if (data?.latitude != null) setLatitude(Number(data.latitude));
        if (data?.longitude != null) setLongitude(Number(data.longitude));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const resolveCoordinates = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (latitude != null && longitude != null) {
      return { lat: latitude, lng: longitude };
    }
    if (!location.trim() || location.trim().length < 3) return null;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/geocode?query=${encodeURIComponent(location.trim())}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
      }
    } catch {
      // ignore
    }
    return null;
  }, [location, latitude, longitude]);

  const handleSubmit = useCallback(async () => {
    setFormError('');
    setLocationError('');

    if (!outcome.trim()) {
      setFormError('Please describe what you want to achieve.');
      return;
    }
    if (!birthDate) {
      setFormError('Birth date is required for your cosmic timeline.');
      return;
    }
 if (!location.trim()) {
      setFormError('Birth location is required.');
      return;
    }

    const coords = await resolveCoordinates();
    if (!coords) {
      setLocationError('Please enter a valid city and country, or select from suggestions.');
      return;
    }

    if (!session) {
      setFormError('Please sign in to generate a timeline.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost(
        '/api/generate-timeline',
        session,
        {
          outcome: outcome.trim(),
          context: context.trim() || undefined,
          availableResources: '',
          preferredApproach: approach,
          timeframe,
          birthDate,
          birthTime: birthTime || '12:00',
          latitude: coords.lat,
          longitude: coords.lng,
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.error?.toLowerCase().includes('credit')) {
          setFormError('Insufficient credits. Buy more or upgrade.');
        } else {
          setFormError(data.error || 'Generation failed. Please try again.');
        }
        setLoading(false);
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
      });
      router.replace({ pathname: '/modal', params: { type: 'results' } });
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    outcome,
    context,
    birthDate,
    birthTime,
    location,
    approach,
    timeframe,
    session,
    resolveCoordinates,
    setResult,
    router,
  ]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Create timeline</Text>
        </View>
        <GlassCard style={styles.card}>
          <Text style={styles.body}>Sign in to generate your cosmic timeline.</Text>
          <GlassButton title="Sign in" onPress={() => router.replace({ pathname: '/modal', params: { type: 'auth' } })} accessibilityLabel="Sign in" />
        </GlassCard>
        <GlassButton title="Cancel" onPress={handleClose} variant="secondary" accessibilityLabel="Cancel" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Create timeline</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GlassTextInput
          label="What do you want to achieve? *"
          value={outcome}
          onChangeText={setOutcome}
          placeholder="e.g. Get promoted, Hit $10k/month"
          accessibilityLabel="Outcome or goal"
        />
        <GlassTextInput
          label="Current situation (optional)"
          value={context}
          onChangeText={setContext}
          placeholder="Brief context..."
          multiline
          numberOfLines={3}
          inputStyle={{ minHeight: 80 }}
          accessibilityLabel="Context"
        />

        <Text style={styles.label}>Approach</Text>
        <View style={styles.chipRow}>
          {APPROACHES.map((a) => (
            <Pressable
              key={a.value}
              onPress={() => {
                Haptics.selectionAsync();
                setApproach(a.value);
              }}
              style={[styles.chip, approach === a.value && styles.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: approach === a.value }}
              accessibilityLabel={a.label}
            >
              <Text style={[styles.chipText, approach === a.value && styles.chipTextActive]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Timeframe (months)</Text>
        <View style={styles.chipRow}>
          {TIMEFRAMES.map((m) => (
            <Pressable
              key={m}
              onPress={() => { Haptics.selectionAsync(); setTimeframe(m); }}
              style={[styles.chip, timeframe === m && styles.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: timeframe === m }}
              accessibilityLabel={`${m} months`}
            >
              <Text style={[styles.chipText, timeframe === m && styles.chipTextActive]}>{m === 12 ? '1Y' : `${m}m`}</Text>
            </Pressable>
          ))}
        </View>

        <GlassTextInput
          label="Birth date *"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          accessibilityLabel="Birth date"
        />
        <GlassTextInput
          label="Birth time (optional)"
          value={birthTime}
          onChangeText={setBirthTime}
          placeholder="12:00"
          accessibilityLabel="Birth time"
        />
        <GlassTextInput
          label="Birth location (city, country) *"
          value={location}
          onChangeText={(t) => { setLocation(t); setLatitude(null); setLongitude(null); setLocationError(''); }}
          placeholder="e.g. New York, USA"
          error={locationError || undefined}
          accessibilityLabel="Birth location"
        />

        {formError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={glassColors.primary} />
            <Text style={styles.loadingText}>Generating your timeline…</Text>
          </View>
        ) : (
          <>
            <GlassButton
              title="Generate"
              onPress={handleSubmit}
              style={styles.submitBtn}
              accessibilityLabel="Generate timeline"
            />
            <GlassButton title="Cancel" onPress={handleClose} variant="secondary" accessibilityLabel="Cancel" />
          </>
        )}
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
  card: {
    marginBottom: glassSpacing.lg,
  },
  body: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.md,
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
  chip: {
    paddingVertical: glassSpacing.sm,
    paddingHorizontal: glassSpacing.md,
    borderRadius: glassBorderRadius.md,
    backgroundColor: glassColors.glass.light,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.default,
    minHeight: 44,
    justifyContent: 'center',
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
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: glassBorderRadius.md,
    padding: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  errorText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.primary,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: glassSpacing.xl,
  },
  loadingText: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginTop: glassSpacing.md,
  },
  submitBtn: {
    marginTop: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
});

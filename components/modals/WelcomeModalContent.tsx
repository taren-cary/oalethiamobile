import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassCard, GlassTextInput } from '@/components/glass';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const MIN_TOUCH_TARGET = 44;

export function WelcomeModalContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setFirstTimeUser } = useAuth();

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if (!birthDate.trim()) {
      setError('Please enter your birth date.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter your birth location.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const timeStr = birthTime.trim() || '12:00';
      const { error: upsertError } = await supabase
        .from('birth_charts')
        .upsert(
          {
            user_id: user.id,
            birth_date: birthDate.trim(),
            birth_time: timeStr,
            location: location.trim(),
            latitude: 0,
            longitude: 0,
            planets: {},
            houses: {},
            ascendant: 0,
            mc: 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (upsertError) throw upsertError;

      setFirstTimeUser(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, birthDate, birthTime, location, setFirstTimeUser, router]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Welcome to your cosmic journey</Text>
        <Text style={styles.subtitle}>
          To create personalized action timelines, we need your birth information.
        </Text>

        <GlassCard cardStyle={styles.card}>
          <Text style={styles.label}>Birth date *</Text>
          <GlassTextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            accessibilityLabel="Birth date"
            accessibilityHint="Enter your birth date in year-month-day format"
          />
        </GlassCard>

        <GlassCard cardStyle={styles.card}>
          <Text style={styles.label}>Birth time (optional)</Text>
          <GlassTextInput
            value={birthTime}
            onChangeText={setBirthTime}
            placeholder="12:00"
            keyboardType="numbers-and-punctuation"
            accessibilityLabel="Birth time"
            accessibilityHint="Defaults to 12:00 PM if left blank"
          />
        </GlassCard>

        <GlassCard cardStyle={styles.card}>
          <Text style={styles.label}>Birth location *</Text>
          <GlassTextInput
            value={location}
            onChangeText={(t) => { setLocation(t); setError(''); }}
            placeholder="City, country or address"
            accessibilityLabel="Birth location"
            accessibilityHint="Enter city, country, or address"
          />
        </GlassCard>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GlassButton
          title={loading ? 'Saving…' : 'Save & continue'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.button}
          accessibilityLabel={loading ? 'Saving' : 'Save and continue'}
          accessibilityState={{ disabled: loading }}
        />
        <GlassButton
          title="Skip for now"
          onPress={handleClose}
          variant="secondary"
          style={styles.button}
          accessibilityLabel="Skip for now"
        />

        <Text style={styles.footer}>
          This is used for personalized astrological transits and cosmic action plans.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingBottom: glassSpacing.xxl,
  },
  title: {
    ...glassTypography.h3,
    color: glassColors.text.primary,
    textAlign: 'center',
    marginTop: glassSpacing.lg,
    marginBottom: glassSpacing.sm,
  },
  subtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    textAlign: 'center',
    marginBottom: glassSpacing.lg,
  },
  card: {
    marginBottom: glassSpacing.md,
  },
  label: {
    ...glassTypography.label,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.xs,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: glassBorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  errorText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.primary,
  },
  button: {
    marginBottom: glassSpacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  footer: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    textAlign: 'center',
    marginTop: glassSpacing.sm,
  },
});

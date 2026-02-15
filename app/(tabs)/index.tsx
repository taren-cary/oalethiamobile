import { Image } from 'expo-image';
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
import { PointsLevelBadge } from '@/components/points-level-badge';
import type { LevelData } from '@/components/points-level-badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { SavedTimeline } from '@/types/timeline';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

const DEFAULT_AFFIRMATION =
  'I am aligned with my purpose and open to the guidance of the cosmos.';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { setShare } = useShare();

  const [profileLoading, setProfileLoading] = useState(true);
  const [levelLoading, setLevelLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [latestTimeline, setLatestTimeline] = useState<SavedTimeline | null>(null);
  const [affirmationText, setAffirmationText] = useState(DEFAULT_AFFIRMATION);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [affirmed, setAffirmed] = useState(false);
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
    fetchProfile();
    fetchLevel();
    fetchLatestTimeline();
  }, [fetchProfile, fetchLevel, fetchLatestTimeline]);

  useEffect(() => {
    fetchTodayAffirmation();
  }, [fetchTodayAffirmation]);

  const handleAffirm = useCallback(async () => {
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
          fetchLevel();
        }
        fetchProfile();
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
    fetchLevel,
    fetchProfile,
  ]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const paddingTop = insets.top + glassSpacing.md;
  const paddingBottom = insets.bottom + 100;

  if (!user) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/oalethiamobilebackground5.png')}
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
          <Text style={styles.brandTitle}>Oalethia</Text>
          <Text style={styles.brandSubtitle}>
            Your cosmic journey begins here.
          </Text>
          <GlassCard style={styles.ctaCard}>
            <Text style={styles.ctaText}>
              Sign in to save timelines, track your streak, and unlock your
              daily affirmations.
            </Text>
            <GlassButton
              title="Sign in"
              onPress={() => router.push({ pathname: '/modal', params: { type: 'auth' } })}
              accessibilityLabel="Sign in to your account"
            />
          </GlassCard>
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
        source={require('@/assets/images/oalethiamobilebackground.jpg')}
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
        <Text style={styles.brandTitle}>Oalethia</Text>

        <View style={styles.statsRow}>
          {profileLoading ? (
            <ActivityIndicator size="small" color={glassColors.primary} />
          ) : (
            <GlassCard cardStyle={styles.streakCard}>
              <Text style={styles.streakText}>
                {streak} day{streak !== 1 ? 's' : ''} streak
              </Text>
            </GlassCard>
          )}
          {levelLoading ? (
            <ActivityIndicator size="small" color={glassColors.primary} />
          ) : levelData ? (
            <PointsLevelBadge levelData={levelData} compact />
          ) : null}
        </View>

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
  ctaCard: {
    marginBottom: glassSpacing.lg,
  },
  ctaText: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: glassSpacing.md,
    alignItems: 'center',
  },
  streakCard: {
    paddingVertical: glassSpacing.sm,
    paddingHorizontal: glassSpacing.md,
  },
  streakText: {
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

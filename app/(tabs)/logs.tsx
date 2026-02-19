import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { GlassCard } from '@/components/glass';
import { SkeletonCard } from '@/components/skeleton-loader/SkeletonLoader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { SavedTimeline } from '@/types/timeline';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

function TimelineLogCard({
  timeline,
  onPress,
  onDelete,
}: {
  timeline: SavedTimeline;
  onPress: () => void;
  onDelete: () => void;
}) {
  const created = new Date(timeline.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const actionCount = timeline.actions?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDelete}
      style={({ pressed }) => [pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open timeline: ${timeline.outcome}`}
      accessibilityHint="Double tap to open. Long press to delete."
    >
      <GlassCard>
        <Text style={styles.cardGoal} numberOfLines={2}>
          {timeline.outcome}
        </Text>
        <Text style={styles.cardMeta}>
          {actionCount} actions · {created}
        </Text>
      </GlassCard>
    </Pressable>
  );
}

export default function LogsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [timelines, setTimelines] = useState<SavedTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimelines = useCallback(async (isRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!isRefresh) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('action_timeline_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimelines(data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timelines');
      setTimelines([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    if (!user) return;
    setRefreshing(true);
    fetchTimelines(true);
  }, [user, fetchTimelines]);

  useEffect(() => {
    fetchTimelines();
  }, [fetchTimelines]);

  const handleDelete = useCallback(
    (timeline: SavedTimeline) => {
      Alert.alert(
        'Delete timeline',
        `Are you sure you want to delete "${timeline.outcome}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error: err } = await supabase
                  .from('action_timeline_generations')
                  .delete()
                  .eq('id', timeline.id)
                  .eq('user_id', user!.id);
                if (err) throw err;
                setTimelines((prev) => prev.filter((t) => t.id !== timeline.id));
              } catch {
                Alert.alert('Error', 'Failed to delete timeline.');
              }
            },
          },
        ]
      );
    },
    [user]
  );

  const paddingTop = insets.top + glassSpacing.md;
  const paddingBottom = insets.bottom + 100;

  if (!user) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpeg')}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={300}
        />
        <View style={[styles.centered, { paddingTop, paddingBottom }]}>
          <EmptyState
            icon="document-text-outline"
            title="Sign in to view timelines"
            description="Create an account or sign in to save and access your cosmic action plans."
            actionLabel="Sign in"
            onAction={() => router.push({ pathname: '/modal', params: { type: 'auth' } })}
          />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpeg')}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={300}
        />
        <View style={[styles.centered, styles.loadingList, { paddingTop, paddingBottom }]}>
          <SkeletonCard />
          <View style={styles.skeletonGap} />
          <SkeletonCard />
          <View style={styles.skeletonGap} />
          <SkeletonCard />
          <Text style={styles.loadingText}>Loading your timelines…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpeg')}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={300}
        />
        <View style={[styles.centered, { paddingTop, paddingBottom }]}>
          <GlassCard>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => fetchTimelines()}
              accessibilityRole="button"
              accessibilityLabel="Retry loading timelines"
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </GlassCard>
        </View>
      </View>
    );
  }

  if (timelines.length === 0) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpeg')}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={300}
        />
        <View style={[styles.centered, { paddingTop, paddingBottom }]}>
          <EmptyState
            icon="document-text-outline"
            title="No timelines yet"
            description="Create your first cosmic action plan from the Generate tab."
            actionLabel="Create timeline"
            onAction={() => router.push('/(tabs)/generator')}
          />
        </View>
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
      <FlatList
        data={timelines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop, paddingBottom },
        ]}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={glassColors.primary}
            colors={[glassColors.primary, glassColors.secondary]}
          />
        }
        renderItem={({ item }) => (
          <TimelineLogCard
            timeline={item}
            onPress={() => router.push({ pathname: '/timeline/[id]', params: { id: item.id } })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  centered: {
    flex: 1,
    paddingHorizontal: glassSpacing.screenPadding,
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
  retryText: {
    ...glassTypography.label,
    color: glassColors.accent,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingBottom: 24,
  },
  loadingList: {
    paddingHorizontal: glassSpacing.screenPadding,
  },
  skeletonGap: {
    height: glassSpacing.md,
  },
  separator: {
    height: glassSpacing.md,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardGoal: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
    marginBottom: 4,
  },
  cardMeta: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
});

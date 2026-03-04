import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { GlassCard } from '@/components/glass';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import {
  generateFakeLeaderboard,
  LEVEL_NAMES,
  type LeaderboardEntry,
} from '@/lib/mockLeaderboardData';
import { HOME_DEV_MODE } from '@/lib/mockHomeData';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

const LEVEL_BADGE_SOURCES: Record<number, any> = {
  1: require('@/assets/badges/level1.svg'),
  2: require('@/assets/badges/level2.svg'),
  3: require('@/assets/badges/level3.svg'),
  4: require('@/assets/badges/level4.svg'),
  5: require('@/assets/badges/level5.svg'),
  6: require('@/assets/badges/level6.svg'),
  7: require('@/assets/badges/level7.svg'),
  8: require('@/assets/badges/level8.svg'),
  9: require('@/assets/badges/level9.svg'),
  10: require('@/assets/badges/level10.svg'),
  11: require('@/assets/badges/level11.svg'),
  12: require('@/assets/badges/level12.svg'),
};

function getLevelBadgeSource(level: number) {
  if (level <= 1) return LEVEL_BADGE_SOURCES[1];
  if (level >= 12) return LEVEL_BADGE_SOURCES[12];
  return LEVEL_BADGE_SOURCES[level] ?? LEVEL_BADGE_SOURCES[1];
}

function LeaderboardRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const isTopThree = index < 3;
  const rankLabel =
    index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`;

  return (
    <View
      style={[
        styles.row,
        isTopThree && styles.rowTopThree,
      ]}
    >
      <Text style={[styles.rank, isTopThree && styles.rankTopThree]} numberOfLines={1}>
        {rankLabel}
      </Text>
      <View style={[styles.badgeWrap, isTopThree && styles.badgeWrapTopThree]}>
        <Image
          source={getLevelBadgeSource(entry.level)}
          style={styles.badgeImage}
          contentFit="contain"
        />
      </View>
      <View style={styles.userBlock}>
        <Text style={[styles.username, isTopThree && styles.usernameTopThree]} numberOfLines={1}>
          {entry.username}
        </Text>
        <Text style={[styles.levelLine, isTopThree && styles.levelLineTopThree]} numberOfLines={1}>
          Level {entry.level}: {entry.levelName}
        </Text>
      </View>
      <View style={styles.pointsBlock}>
        <Text style={[styles.pointsValue, isTopThree && styles.pointsValueTopThree]}>
          {entry.lifetimePoints.toLocaleString()}
        </Text>
        <Text style={[styles.pointsLabel, isTopThree && styles.pointsLabelTopThree]}>
          points
        </Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const useFakeData = HOME_DEV_MODE && !user;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    if (useFakeData) {
      setLeaderboard(generateFakeLeaderboard(25));
      setLoading(false);
      return;
    }
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiGet('/api/leaderboard?limit=25', session);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted: LeaderboardEntry[] = data.slice(0, 25).map((entry: any, index: number) => ({
            rank: index + 1,
            userId: entry.userId ?? entry.user_id ?? `user-${index}`,
            username: entry.username ?? `user_${String(entry.userId ?? entry.user_id ?? index).slice(0, 8)}`,
            lifetimePoints: entry.lifetimePoints ?? entry.lifetime_points ?? 0,
            level: entry.level ?? 1,
            levelName: entry.levelName ?? LEVEL_NAMES[entry.level ?? 1] ?? 'Unknown',
          }));
          setLeaderboard(formatted);
        } else {
          setLeaderboard(generateFakeLeaderboard(25));
        }
      } else {
        setLeaderboard(generateFakeLeaderboard(25));
      }
    } catch {
      setLeaderboard(generateFakeLeaderboard(25));
    } finally {
      setLoading(false);
    }
  }, [session, useFakeData]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const paddingTop = insets.top + glassSpacing.md;
  const paddingBottom = insets.bottom + glassSpacing.lg;

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Leaderboard',
            headerBackTitle: 'Profile',
            headerStyle: { backgroundColor: '#0a0a0f' },
            headerTintColor: '#ffffff',
            headerShadowVisible: false,
          }}
        />
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpeg')}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <View style={[styles.centered, { paddingTop, paddingBottom }]}>
          <ActivityIndicator size="large" color={glassColors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard…</Text>
        </View>
      </View>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Leaderboard',
            headerBackTitle: 'Profile',
            headerStyle: { backgroundColor: '#0a0a0f' },
            headerTintColor: '#ffffff',
            headerShadowVisible: false,
          }}
        />
        <Image
          source={require('@/assets/images/oalethiamobilebackground.jpeg')}
          style={styles.backgroundImage}
          contentFit="cover"
        />
        <View style={[styles.centered, { paddingTop, paddingBottom }]}>
          <EmptyState
            icon="podium-outline"
            title="No one on the leaderboard yet"
            description="Be the first to earn points by affirming your daily affirmations."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Leaderboard',
          headerBackTitle: 'Profile',
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#ffffff',
          headerShadowVisible: false,
        }}
      />
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpeg')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={[styles.header, { paddingTop }]}>
        <Text style={styles.subtitle}>
          Those who navigated the odds & reached their destination
        </Text>
      </View>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => <LeaderboardRow entry={item} index={index} />}
        contentContainerStyle={[styles.listContent, { paddingBottom }]}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: glassSpacing.screenPadding,
  },
  loadingText: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginTop: glassSpacing.md,
  },
  header: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingBottom: glassSpacing.md,
  },
  subtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: glassSpacing.screenPadding,
  },
  separator: {
    height: glassSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: glassSpacing.sm,
    paddingHorizontal: glassSpacing.md,
    borderRadius: glassSpacing.md,
    backgroundColor: glassColors.glass.light,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.subtle,
    gap: glassSpacing.sm,
  },
  rowTopThree: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  rank: {
    width: 36,
    textAlign: 'center',
    ...glassTypography.h5,
    color: glassColors.text.primary,
  },
  rankTopThree: {
    color: '#fde047',
  },
  badgeWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWrapTopThree: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  userBlock: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    ...glassTypography.label,
    color: glassColors.text.primary,
  },
  usernameTopThree: {
    color: '#fef08a',
  },
  levelLine: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: 2,
  },
  levelLineTopThree: {
    color: 'rgba(254, 240, 138, 0.8)',
  },
  pointsBlock: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    ...glassTypography.label,
    color: glassColors.accent,
  },
  pointsValueTopThree: {
    color: '#fde047',
  },
  pointsLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
  },
  pointsLabelTopThree: {
    color: 'rgba(254, 240, 138, 0.7)',
  },
});

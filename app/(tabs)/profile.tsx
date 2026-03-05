import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassCard } from '@/components/glass';
import { Ionicons } from '@expo/vector-icons';
import type { LevelData } from '@/components/points-level-badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePointsRefresh } from '@/contexts/PointsRefreshContext';
import { apiGet } from '@/lib/api';
import {
  generateFakeLeaderboard,
  LEVEL_NAMES,
  type LeaderboardEntry,
} from '@/lib/mockLeaderboardData';
import {
  getMockHomeData,
  HOME_DEV_MODE,
} from '@/lib/mockHomeData';
import { supabase, supabaseUrl } from '@/lib/supabase';
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
  if (level <= 1) {
    return LEVEL_BADGE_SOURCES[1];
  }
  if (level >= 12) {
    return LEVEL_BADGE_SOURCES[12];
  }
  return LEVEL_BADGE_SOURCES[level] ?? LEVEL_BADGE_SOURCES[1];
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session, signOut } = useAuth();
  const { invalidateAt } = usePointsRefresh();

  // Phase 1: dev/mock view for design & UX
  const useDevProfileData = HOME_DEV_MODE && !user;
  const mockData = useDevProfileData ? getMockHomeData() : null;

  const [profileLoading, setProfileLoading] = useState(!useDevProfileData);
  const [levelLoading, setLevelLoading] = useState(!useDevProfileData);
  const [subscriptionLoading, setSubscriptionLoading] = useState(!useDevProfileData);
  const [streak, setStreak] = useState(
    useDevProfileData && mockData ? mockData.streak : 0
  );
  const [levelData, setLevelData] = useState<LevelData | null>(
    useDevProfileData && mockData ? mockData.levelData : null
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    tier?: { name?: string };
    isFree?: boolean;
    status?: string;
  } | null>(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState<LeaderboardEntry[]>([]);
  const [leaderboardPreviewLoading, setLeaderboardPreviewLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (useDevProfileData) {
      setProfileLoading(false);
      return;
    }
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
  }, [session, useDevProfileData]);

  const fetchLevel = useCallback(async () => {
    if (useDevProfileData) {
      setLevelLoading(false);
      return;
    }
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
  }, [session, useDevProfileData]);

  const fetchSubscription = useCallback(async () => {
    if (useDevProfileData) {
      setSubscriptionStatus({
        isFree: true,
        status: 'active',
        tier: { name: 'Free' },
      });
      setSubscriptionLoading(false);
      return;
    }
    if (!session) {
      setSubscriptionLoading(false);
      return;
    }
    try {
      const res = await apiGet('/api/user-subscription', session);
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data);
      } else {
        setSubscriptionStatus({ isFree: true, status: 'active' });
      }
    } catch {
      setSubscriptionStatus({ isFree: true, status: 'active' });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [session, useDevProfileData]);

  const fetchLeaderboardPreview = useCallback(async () => {
    if (useDevProfileData) {
      setLeaderboardPreview(generateFakeLeaderboard(25).slice(0, 3));
      setLeaderboardPreviewLoading(false);
      return;
    }
    if (!session) {
      setLeaderboardPreviewLoading(false);
      return;
    }
    try {
      const res = await apiGet('/api/leaderboard?limit=3', session);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted: LeaderboardEntry[] = data.slice(0, 3).map((entry: any, index: number) => ({
            rank: index + 1,
            userId: entry.userId ?? entry.user_id ?? `user-${index}`,
            username: entry.username ?? `user_${String(entry.userId ?? entry.user_id ?? index).slice(0, 8)}`,
            lifetimePoints: entry.lifetimePoints ?? entry.lifetime_points ?? 0,
            level: entry.level ?? 1,
            levelName: entry.levelName ?? LEVEL_NAMES[entry.level ?? 1] ?? 'Unknown',
          }));
          setLeaderboardPreview(formatted);
        } else {
          setLeaderboardPreview(generateFakeLeaderboard(25).slice(0, 3));
        }
      } else {
        setLeaderboardPreview(generateFakeLeaderboard(25).slice(0, 3));
      }
    } catch {
      setLeaderboardPreview(generateFakeLeaderboard(25).slice(0, 3));
    } finally {
      setLeaderboardPreviewLoading(false);
    }
  }, [session, useDevProfileData]);

  useEffect(() => {
    fetchProfile();
    fetchLevel();
    fetchSubscription();
    fetchLeaderboardPreview();
  }, [fetchProfile, fetchLevel, fetchSubscription, fetchLeaderboardPreview]);

  const fetchAvatarUrl = useCallback(async () => {
    if (useDevProfileData || !user) {
      setAvatarUrl(null);
      return;
    }
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      setAvatarUrl(data?.avatar_url ?? null);
    } catch {
      setAvatarUrl(null);
    }
  }, [user, useDevProfileData]);

  useEffect(() => {
    fetchAvatarUrl();
  }, [fetchAvatarUrl]);

  const pickAndUploadAvatar = useCallback(async () => {
    if (!user || avatarUploading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to set a profile picture.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setAvatarUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const path = `${user.id}/avatar.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) throw updateError;
      setAvatarUrl(`${publicUrl}${publicUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
    } catch (e) {
      Alert.alert(
        'Upload failed',
        e instanceof Error ? e.message : 'Could not set profile picture. Try again.'
      );
    } finally {
      setAvatarUploading(false);
    }
  }, [user, avatarUploading]);

  useEffect(() => {
    if (useDevProfileData || invalidateAt <= 0) {
      return;
    }
    if (invalidateAt > 0) {
      fetchLevel();
      fetchProfile();
    }
  }, [invalidateAt, fetchLevel, fetchProfile, useDevProfileData]);

  const paddingTop = insets.top + glassSpacing.md;
  const paddingBottom = insets.bottom + 100;

  if (!user && !useDevProfileData) {
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop, paddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Profile</Text>
        </ScrollView>
      </View>
    );
  }

  const displayEmail =
    user?.email ?? (useDevProfileData ? 'demo@oalethia.app' : 'Signed in');
  const displayInitial = displayEmail.charAt(0).toUpperCase();

  const handleDeleteAccount = useCallback(() => {
    if (!user || !session || accountDeleting) {
      if (!user || !session) {
        Alert.alert('Not signed in', 'You need to be signed in to delete your account.');
      }
      return;
    }

    Alert.alert(
      'Delete your account?',
      'This will permanently delete your account, timelines, points, birth data, and all related activity. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setAccountDeleting(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              const { error } = await supabase.functions.invoke('delete-account', {
                method: 'POST',
                body: {},
              });
              if (error) {
                Alert.alert(
                  'Deletion failed',
                  'We could not delete your account right now. Please try again in a moment.'
                );
                setAccountDeleting(false);
                return;
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Account deleted',
                'Your account and all associated data have been deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      signOut();
                    },
                  },
                ]
              );
            } catch {
              Alert.alert(
                'Deletion failed',
                'We could not delete your account right now. Please check your connection and try again.'
              );
              setAccountDeleting(false);
            }
          },
        },
      ]
    );
  }, [user, session, accountDeleting, signOut]);

  const handleSettingsRowPress = useCallback(
    (label: string) => {
      if (label === 'Delete account') {
        handleDeleteAccount();
        return;
      }
      Alert.alert('Dev view', `${label} – not implemented yet.`);
    },
    [handleDeleteAccount]
  );

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop, paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* Avatar + welcome + username */}
        <View style={styles.headerBlock}>
          <Pressable
            onPress={!useDevProfileData && user && !avatarUploading ? pickAndUploadAvatar : undefined}
            style={({ pressed }) => [
              styles.avatarLarge,
              pressed && !avatarUploading && styles.avatarPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={avatarUploading ? 'Uploading profile picture' : 'Change profile picture'}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarLargeInitial}>{displayInitial}</Text>
            )}
            {avatarUploading && (
              <View style={styles.avatarUploadOverlay}>
                <ActivityIndicator size="small" color={glassColors.primary} />
              </View>
            )}
          </Pressable>
          <Text style={styles.headerGreeting}>Welcome back</Text>
          <Text style={styles.headerUsername} numberOfLines={1}>
            {displayEmail}
          </Text>
        </View>

        {/* Level / badge card with actual badge art, then streak, then subscription */}
        {levelLoading ? (
          <ActivityIndicator size="small" color={glassColors.primary} />
        ) : levelData ? (
          <GlassCard cardStyle={styles.levelCard}>
            <View style={styles.levelRow}>
              <View style={styles.levelBadgeWrapper}>
                <Image
                  source={getLevelBadgeSource(levelData.level)}
                  style={styles.levelBadgeImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.levelTextBlock}>
                <Text style={styles.levelTitle} numberOfLines={1}>
                  Level {levelData.level}: {levelData.levelName}
                </Text>
                {!levelData.isMaxLevel ? (
                  <>
                    <View style={styles.levelProgressTrack}>
                      <LinearGradient
                        colors={glassColors.progressBar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.levelProgressFill,
                          { width: `${levelData.progressPercent}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.levelPointsToNext}>
                      {levelData.pointsNeeded.toLocaleString()} points to next level
                    </Text>
                  </>
                ) : (
                  <Text style={styles.levelMaxLabel}>Max level achieved</Text>
                )}
                <Text style={styles.levelLifetimePoints}>
                  {levelData.lifetimePoints.toLocaleString()} pts total
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : null}

        {profileLoading ? (
          <ActivityIndicator size="small" color={glassColors.primary} />
        ) : (
          <GlassCard cardStyle={styles.streakCard}>
            <Text style={styles.streakLabel}>Affirmation streak</Text>
            <Text style={styles.streakValue}>
              {streak} day{streak !== 1 ? 's' : ''}
            </Text>
          </GlassCard>
        )}

        <GlassCard cardStyle={styles.leaderboardCard}>
          <View style={styles.leaderboardCardHeader}>
            <Text style={styles.leaderboardCardTitle}>Leaderboard</Text>
          </View>
          <View style={styles.settingsRowDivider} />
          {leaderboardPreviewLoading ? (
            <ActivityIndicator size="small" color={glassColors.primary} style={styles.leaderboardLoader} />
          ) : (
            <>
              {leaderboardPreview.length === 0 ? (
                <Text style={styles.leaderboardEmptyText}>
                  No one on the leaderboard yet. Be the first by affirming daily!
                </Text>
              ) : (
                leaderboardPreview.map((entry, index) => (
                  <View key={entry.userId} style={styles.leaderboardPreviewRow}>
                    <Text style={styles.leaderboardRank}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Text>
                    <Text style={styles.leaderboardUsername} numberOfLines={1}>
                      {entry.username}
                    </Text>
                    <Text style={styles.leaderboardPts}>
                      {entry.lifetimePoints.toLocaleString()} pts
                    </Text>
                  </View>
                ))
              )}
              <View style={styles.settingsRowDivider} />
              <Pressable
                style={({ pressed }) => [styles.subRow, pressed && styles.settingsRowPressed]}
                onPress={() => router.push('/leaderboard')}
                accessibilityRole="button"
                accessibilityLabel="View full leaderboard"
              >
                <Ionicons name="podium-outline" size={20} color={glassColors.primary} />
                <Text style={styles.settingsRowLabel}>View full leaderboard</Text>
                <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
              </Pressable>
            </>
          )}
        </GlassCard>

        {subscriptionLoading ? (
          <ActivityIndicator size="small" color={glassColors.primary} />
        ) : (
          <GlassCard cardStyle={styles.subCard}>
            <View style={styles.subHeader}>
              <Text style={styles.subLabel}>Subscription & Billing</Text>
              <Text style={styles.subValue}>
                {subscriptionStatus?.isFree
                  ? 'Free plan'
                  : subscriptionStatus?.tier?.name ?? 'Free plan'}
              </Text>
            </View>
            <View style={styles.subRowDivider} />
            <Pressable
              style={({ pressed }) => [styles.subRow, pressed && styles.settingsRowPressed]}
              onPress={() => router.push({ pathname: '/modal', params: { type: 'subscription' } })}
              accessibilityRole="button"
              accessibilityLabel="Upgrade to Premium"
            >
              <Ionicons name="star-outline" size={20} color={glassColors.primary} />
              <Text style={styles.settingsRowLabel}>Upgrade to Premium</Text>
              <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
            </Pressable>
            <View style={styles.settingsRowDivider} />
            <Pressable
              style={({ pressed }) => [styles.subRow, pressed && styles.settingsRowPressed]}
              onPress={() => router.push({ pathname: '/modal', params: { type: 'credits' } })}
              accessibilityRole="button"
              accessibilityLabel="Buy credits"
            >
              <Ionicons name="wallet-outline" size={20} color={glassColors.text.primary} />
              <Text style={styles.settingsRowLabel}>Buy credits</Text>
              <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
            </Pressable>
            <View style={styles.settingsRowDivider} />
            <Pressable
              style={({ pressed }) => [styles.subRow, pressed && styles.settingsRowPressed]}
              onPress={() => handleSettingsRowPress('Restore Purchases')}
              accessibilityRole="button"
              accessibilityLabel="Restore previous in-app purchases"
            >
              <Ionicons name="refresh-outline" size={20} color={glassColors.text.primary} />
              <Text style={styles.settingsRowLabel}>Restore Purchases</Text>
              <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
            </Pressable>
          </GlassCard>
        )}

        <GlassCard cardStyle={styles.settingsListCard}>
          <View style={styles.settingsCardHeader}>
            <Text style={styles.settingsCardTitle}>Settings</Text>
          </View>
          <View style={styles.settingsRowDivider} />
          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
            onPress={() => handleSettingsRowPress('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={glassColors.text.primary} />
            <Text style={styles.settingsRowLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
          </Pressable>
          <View style={styles.settingsRowDivider} />
          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
            onPress={() => handleSettingsRowPress('Privacy Policy')}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
          >
            <Ionicons name="shield-outline" size={20} color={glassColors.text.primary} />
            <Text style={styles.settingsRowLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
          </Pressable>
          <View style={styles.settingsRowDivider} />
          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
            onPress={() => handleSettingsRowPress('Terms of Service')}
            accessibilityRole="button"
            accessibilityLabel="Terms of Service"
          >
            <Ionicons name="document-text-outline" size={20} color={glassColors.text.primary} />
            <Text style={styles.settingsRowLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
          </Pressable>
          <View style={styles.settingsRowDivider} />
          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
            onPress={() => handleSettingsRowPress('Contact support')}
            accessibilityRole="button"
            accessibilityLabel="Contact support"
          >
            <Ionicons name="mail-outline" size={20} color={glassColors.text.primary} />
            <Text style={styles.settingsRowLabel}>Contact support</Text>
            <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
          </Pressable>
          <View style={styles.settingsRowDivider} />
          <Pressable
            style={({ pressed }) => [
              styles.settingsRow,
              pressed && styles.settingsRowPressed,
              accountDeleting && styles.settingsRowDisabled,
            ]}
            onPress={accountDeleting ? undefined : () => handleSettingsRowPress('Delete account')}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            accessibilityState={{ disabled: accountDeleting }}
          >
            <Ionicons name="trash-outline" size={20} color={glassColors.error} />
            <Text style={[styles.settingsRowLabel, styles.settingsRowLabelDanger]}>
              Delete account
            </Text>
            {accountDeleting ? (
              <ActivityIndicator size="small" color={glassColors.text.tertiary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={glassColors.text.tertiary} />
            )}
          </Pressable>
        </GlassCard>

        <GlassButton
          title="Sign out"
          onPress={() => signOut()}
          variant="secondary"
          style={styles.button}
          accessibilityLabel="Sign out of your account"
        />
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
    gap: glassSpacing.sectionGap,
    paddingBottom: 24,
  },
  title: {
    ...glassTypography.h2,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.sm,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: glassSpacing.lg,
    marginTop: glassSpacing.sm,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: glassColors.glass.medium,
    marginBottom: glassSpacing.sm,
    overflow: 'hidden',
  },
  avatarPressed: {
    opacity: 0.9,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeInitial: {
    ...glassTypography.h3,
    color: glassColors.text.primary,
  },
  headerGreeting: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 2,
  },
  headerUsername: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  levelCard: {
    paddingVertical: glassSpacing.sm,
    paddingHorizontal: glassSpacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadgeWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: glassSpacing.md,
  },
  levelBadgeImage: {
    width: '100%',
    height: '100%',
  },
  levelTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  levelTitle: {
    ...glassTypography.label,
    color: glassColors.text.primary,
  },
  levelProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: glassColors.glass.light,
    overflow: 'hidden',
    marginTop: glassSpacing.sm,
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelPointsToNext: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: glassSpacing.xs,
  },
  levelMaxLabel: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: glassSpacing.xs,
  },
  levelLifetimePoints: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: glassSpacing.sm,
  },
  body: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.md,
  },
  streakCard: {
    paddingVertical: glassSpacing.md,
  },
  streakLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 4,
  },
  streakValue: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  leaderboardCard: {
    paddingVertical: 0,
    paddingHorizontal: glassSpacing.md,
    overflow: 'hidden',
  },
  leaderboardCardHeader: {
    paddingVertical: glassSpacing.md,
  },
  leaderboardCardTitle: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
  },
  leaderboardLoader: {
    paddingVertical: glassSpacing.lg,
  },
  leaderboardEmptyText: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    textAlign: 'center',
    paddingVertical: glassSpacing.md,
    paddingHorizontal: glassSpacing.sm,
  },
  leaderboardPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: glassSpacing.sm,
    gap: glassSpacing.sm,
  },
  leaderboardRank: {
    width: 28,
    textAlign: 'center',
    fontSize: 18,
  },
  leaderboardUsername: {
    flex: 1,
    ...glassTypography.label,
    color: glassColors.text.primary,
    minWidth: 0,
  },
  leaderboardPts: {
    ...glassTypography.labelSmall,
    color: glassColors.accent,
  },
  subCard: {
    paddingVertical: 0,
    paddingHorizontal: glassSpacing.md,
    overflow: 'hidden',
  },
  subHeader: {
    paddingVertical: glassSpacing.md,
  },
  subLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 2,
  },
  subValue: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  subRowDivider: {
    height: 1,
    backgroundColor: glassColors.glassBorder.subtle,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: glassSpacing.md,
    minHeight: 44,
    gap: glassSpacing.sm,
  },
  settingsListCard: {
    paddingVertical: 0,
    paddingHorizontal: glassSpacing.md,
    overflow: 'hidden',
  },
  settingsCardHeader: {
    paddingVertical: glassSpacing.md,
  },
  settingsCardTitle: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: glassSpacing.md,
    minHeight: 44,
    gap: glassSpacing.sm,
  },
  settingsRowPressed: {
    opacity: 0.8,
  },
  settingsRowLabel: {
    flex: 1,
    ...glassTypography.label,
    color: glassColors.text.primary,
  },
  settingsRowLabelDanger: {
    color: glassColors.error,
  },
  settingsRowDisabled: {
    opacity: 0.6,
  },
  settingsRowDivider: {
    height: 1,
    backgroundColor: glassColors.glassBorder.subtle,
  },
  button: {
    alignSelf: 'stretch',
  },
});

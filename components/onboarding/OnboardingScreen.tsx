import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/glass/GlassButton';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const ONBOARDING_STORAGE_KEY = '@oalethia/onboarding_complete';

const SLIDES = [
  { id: '1', source: require('@/assets/images/onboarding1.jpg') },
  { id: '2', source: require('@/assets/images/onboarding2.jpg') },
  { id: '3', source: require('@/assets/images/onboarding3.jpg') },
  { id: '4', source: require('@/assets/images/onboarding4.jpg') },
] as const;

export function getOnboardingStorageKey(): string {
  return ONBOARDING_STORAGE_KEY;
}

interface OnboardingScreenProps {
  /** Called when user finishes. skipped: true = tapped Skip, false = tapped Get started. */
  onFinish: (opts: { skipped: boolean }) => void;
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      if (i >= 0 && i < SLIDES.length && i !== index) setIndex(i);
    },
    [width, index]
  );

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFinish({ skipped: true });
  }, [onFinish]);

  const handleGetStarted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFinish({ skipped: false });
  }, [onFinish]);

  const renderItem: ListRenderItem<(typeof SLIDES)[number]> = useCallback(
    ({ item, index: slideIndex }) => (
      <View style={[styles.slide, { width }]}>
        <Image
          source={item.source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {slideIndex === 0 && (
          <View
            style={[
              styles.slideCardContainer,
              {
                paddingBottom: insets.bottom + 12 + 24,
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={glassColors.gradientBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <BlurView
                intensity={10}
                tint="light"
                style={styles.clearGlassCard}
              >
                <View style={styles.headlineWrap}>
                  <Text style={styles.headline} numberOfLines={2}>
                    Reaching Your Goals Just Got Alot Easier
                  </Text>
                </View>
                <Text style={styles.bodyText}>
                  Become a master at navigating reality and manifest your goals on
                  autopilot with the help of AI and Quantum Astrology.
                </Text>
              </BlurView>
            </LinearGradient>
          </View>
        )}
        {slideIndex === 1 && (
          <View
            style={[
              styles.slideCardContainer,
              {
                paddingBottom: insets.bottom + 12 + 24,
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={glassColors.gradientBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <BlurView
                intensity={20}
                tint="light"
                style={styles.clearGlassCard}
              >
                <View style={styles.headlineWrap}>
                  <Text style={styles.headline}>Chart Your Course</Text>
                </View>
                <Text style={styles.bodyText}>
                  We use your birth date, time, and place to map your transits. AI
                  then plots 8–12 concrete actions timed to the right cosmic
                  moments.
                </Text>
              </BlurView>
            </LinearGradient>
          </View>
        )}
        {slideIndex === 2 && (
          <View
            style={[
              styles.slideCardContainer,
              {
                paddingBottom: insets.bottom + 12 + 24,
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={glassColors.gradientBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <BlurView
                intensity={20}
                tint="light"
                style={styles.clearGlassCard}
              >
                <View style={styles.headlineWrap}>
                  <Text style={styles.headline}>
                    Earn your rank.
                  </Text>
                </View>
                <Text style={styles.bodyText}>
                  Every action and daily affirmation earns you points. Level up
                  through 12 navigation ranks—from Initiate of the Compass to
                  Cosmic Admiral and beyond. See where you stand on the crew
                  leaderboard.
                </Text>
              </BlurView>
            </LinearGradient>
          </View>
        )}
        {slideIndex === 3 && (
          <View
            style={[
              styles.slideCardContainer,
              {
                paddingBottom: insets.bottom + 12 + 24,
              },
            ]}
            pointerEvents="box-none"
          >
            <LinearGradient
              colors={glassColors.gradientBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <BlurView
                intensity={20}
                tint="light"
                style={styles.clearGlassCard}
              >
                <View style={styles.headlineWrap}>
                  <Text style={styles.headline}>Ready to lift off?</Text>
                </View>
                <Text style={styles.bodyText}>
                  Add your birth details once. We use them only to build your
                  personal star map and plan.
                </Text>
                <GlassButton
                  title="Get started"
                  onPress={handleGetStarted}
                  accessibilityLabel="Finish onboarding and open app"
                  style={styles.cardGetStarted}
                />
              </BlurView>
            </LinearGradient>
          </View>
        )}
      </View>
    ),
    [width, insets.bottom, handleGetStarted]
  );

  const keyExtractor = useCallback(
    (item: (typeof SLIDES)[number]) => item.id,
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: glassSpacing.screenPadding,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={handleSkip}
            hitSlop={12}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        <View style={styles.spacer} />
        <View style={styles.bottomSection}>
          <View style={styles.placeholder} />
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    gap: glassSpacing.lg,
  },
  slideCardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: glassSpacing.screenPadding,
  },
  cardGradient: {
    padding: 1,
    borderRadius: glassBorderRadius.card,
  },
  clearGlassCard: {
    padding: glassSpacing.cardPadding,
    borderRadius: glassBorderRadius.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headlineWrap: {
    marginBottom: glassSpacing.sm,
  },
  headline: {
    ...glassTypography.h2,
    color: '#fbbf24',
    textShadowColor: 'rgba(251, 191, 36, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  cardGetStarted: {
    marginTop: glassSpacing.md,
  },
  bodyText: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
  },
  bodyAccent: {
    ...glassTypography.body,
    color: glassColors.warning,
  },
  skip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  skipText: {
    ...glassTypography.label,
    color: glassColors.text.secondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: glassColors.primary,
    width: 24,
  },
  placeholder: {
    height: 48,
  },
});

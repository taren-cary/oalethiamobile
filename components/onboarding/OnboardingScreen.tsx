import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
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
import { glassColors, glassSpacing, glassTypography } from '@/theme';

const ONBOARDING_STORAGE_KEY = '@oalethia/onboarding_complete';

const SLIDES = [
  { id: '1', source: require('@/assets/images/onboarding1.jpg') },
  { id: '2', source: require('@/assets/images/onboarding2.jpg') },
  { id: '3', source: require('@/assets/images/onboarding3.jpg') },
] as const;

export function getOnboardingStorageKey(): string {
  return ONBOARDING_STORAGE_KEY;
}

interface OnboardingScreenProps {
  onFinish: () => void;
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
    onFinish();
  }, [onFinish]);

  const handleGetStarted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFinish();
  }, [onFinish]);

  const renderItem: ListRenderItem<(typeof SLIDES)[number]> = useCallback(
    ({ item }) => (
      <View style={[styles.slide, { width }]}>
        <Image
          source={item.source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
    ),
    [width]
  );

  const keyExtractor = useCallback((item: (typeof SLIDES)[number]) => item.id, []);

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
            paddingBottom: insets.bottom + glassSpacing.lg,
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
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        {index === SLIDES.length - 1 ? (
          <GlassButton
            title="Get started"
            onPress={handleGetStarted}
            accessibilityLabel="Finish onboarding and open app"
          />
        ) : (
          <View style={styles.placeholder} />
        )}
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

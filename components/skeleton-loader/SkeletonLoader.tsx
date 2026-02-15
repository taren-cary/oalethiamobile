import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { glassColors, glassSpacing } from '@/theme';

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = 12,
  style,
}: SkeletonLoaderProps) {
  const translateX = useSharedValue(-200);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(200, { duration: 1500 }),
      -1,
      false
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.outer,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerWrap, animatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Card-shaped skeleton for list items (e.g. timeline logs). */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="60%" height={20} style={styles.cardTitle} />
      <SkeletonLoader width="40%" height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: glassColors.glass.light,
    overflow: 'hidden',
  },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  card: {
    backgroundColor: glassColors.glass.light,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.subtle,
    padding: glassSpacing.cardPadding,
  },
  cardTitle: {
    marginBottom: glassSpacing.sm,
  },
});

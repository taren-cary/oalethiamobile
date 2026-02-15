import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CircularNavButtonProps {
  isActive: boolean;
  onPress: () => void;
  children?: ReactNode;
  accessibilityLabel: string;
}

export function CircularNavButton({
  isActive,
  onPress,
  children,
  accessibilityLabel,
}: CircularNavButtonProps) {
  const scale = useSharedValue(isActive ? 1.1 : 1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    const duration = reduceMotion ? 0 : 200;
    scale.value = withTiming(isActive ? 1.1 : 1, { duration });
  }, [isActive, scale, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduceMotion) scale.value = withTiming(1.05, { duration: 150 });
  };

  const handlePressOut = () => {
    if (!reduceMotion) scale.value = withTiming(isActive ? 1.1 : 1, { duration: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.outer, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      accessibilityHint={isActive ? undefined : 'Double tap to switch tab'}
    >
      <View style={[styles.circleWrapper, isActive && styles.circleActive]}>
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        {children}
      </View>
    </AnimatedPressable>
  );
}

const CIRCLE_SIZE = 60;
const BORDER_RADIUS = CIRCLE_SIZE / 2;

const styles = StyleSheet.create({
  outer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  circleActive: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
});

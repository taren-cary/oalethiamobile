import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
  type StyleProp,
  type ViewStyle,
  Pressable,
  Text,
  StyleSheet,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: GlassButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withTiming(0.95, { duration: 150 });
    }
  }, [disabled, loading, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress();
  }, [disabled, loading, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.6 : 1,
  }));

  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[styles.minTouch, animatedStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
    >
      <Text
        style={[
          styles.text,
          isPrimary ? styles.textPrimary : styles.textSecondary,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {loading ? '...' : title}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  minTouch: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: glassSpacing.lg,
    paddingVertical: glassSpacing.md,
    borderRadius: glassBorderRadius.button,
    backgroundColor: glassColors.glass.medium,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.default,
  },
  text: {
    ...glassTypography.label,
    color: glassColors.text.primary,
  },
  textPrimary: {
    color: glassColors.accent,
  },
  textSecondary: {
    color: glassColors.text.secondary,
  },
});

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  type StyleProp,
  type ViewStyle,
  Pressable,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { blurIntensity, glassBorderRadius, glassColors } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type GlassBlur = 'light' | 'medium' | 'strong';

export interface GlassContainerProps {
  blur?: GlassBlur;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressable?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  gradientBorder?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function GlassContainer({
  blur = 'medium',
  children,
  style,
  pressable = false,
  onPress,
  onLongPress,
  gradientBorder = false,
  accessibilityLabel,
  accessibilityHint,
}: GlassContainerProps) {
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);

  const intensity = blurIntensity[blur];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (pressable) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPressed(true);
        scale.value = withTiming(0.95, { duration: 150 });
      }
    },
    [pressable, scale]
  );

  const handlePressOut = useCallback(() => {
    setPressed(false);
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  const blurContent = (
    <BlurView
      intensity={intensity}
      tint="light"
      style={[
        {
          borderRadius: glassBorderRadius.xl,
          overflow: 'hidden',
          backgroundColor: glassColors.glass.medium,
          borderWidth: 1,
          borderColor: glassColors.glassBorder.default,
        },
      ]}
    >
      {children}
    </BlurView>
  );

  const wrappedContent = gradientBorder ? (
    <LinearGradient
      colors={glassColors.gradientBorder}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ padding: 1, borderRadius: glassBorderRadius.xl }}
    >
      <BlurView
        intensity={intensity}
        tint="light"
        style={{
          borderRadius: glassBorderRadius.xl - 1,
          overflow: 'hidden',
          backgroundColor: glassColors.glass.medium,
        }}
      >
        {children}
      </BlurView>
    </LinearGradient>
  ) : (
    blurContent
  );

  if (pressable && (onPress || onLongPress)) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{}}
      >
        {wrappedContent}
      </AnimatedPressable>
    );
  }

  return <View style={style}>{wrappedContent}</View>;
}

import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';

interface PressHoldGenerateButtonProps {
  onComplete?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** How long the user must hold (ms). */
  holdDurationMs?: number;
}

export function PressHoldGenerateButton({
  onComplete,
  disabled = false,
  loading = false,
  holdDurationMs = 1500,
}: PressHoldGenerateButtonProps) {
  const [completed, setCompleted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
    };
  }, []);

  // Reset completed state when loading finishes (either success or failure)
  useEffect(() => {
    if (!loading && completed) {
      const timer = setTimeout(() => {
        reset();
      }, 500); // Small delay to show the completed state briefly on success
      return () => clearTimeout(timer);
    }
  }, [loading, completed]);

  const reset = () => {
    setCompleted(false);
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handlePressIn = () => {
    if (disabled || loading || completed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(progress, {
      toValue: 1,
      duration: holdDurationMs,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !completed && !disabled && !loading) {
        setCompleted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete?.();
      }
    });
  };

  const handlePressOut = () => {
    if (!completed) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const widthInterpolation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const label = completed
    ? 'Timeline launched ✅'
    : loading
    ? 'Generating…'
    : 'Press and hold to generate';

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel="Press and hold to generate timeline"
        accessibilityState={{ disabled: disabled || loading }}
        style={[
          styles.button,
          (disabled || loading) && { opacity: 0.6 },
        ]}
      >
        <Animated.View style={[styles.progressBar, { width: widthInterpolation }]} />
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: glassSpacing.lg,
  },
  button: {
    height: 56,
    borderRadius: glassBorderRadius.full,
    backgroundColor: glassColors.glass.medium,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.active,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: glassColors.primary,
    opacity: 0.45,
  },
  text: {
    ...glassTypography.body,
    color: glassColors.text.primary,
  },
});


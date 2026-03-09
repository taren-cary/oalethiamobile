import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GlassButton } from '@/components/glass';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

interface WelcomeBadgeModalContentProps {
  visible: boolean;
  onPrimary: () => void;
  onDismiss: () => void;
}

export function WelcomeBadgeModalContent({
  visible,
  onPrimary,
  onDismiss,
}: WelcomeBadgeModalContentProps) {
  if (!visible) {
    return null;
  }

  const handlePrimary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrimary();
  };

  const handleDismiss = () => {
    Haptics.selectionAsync();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessibilityViewIsModal
      accessibilityLabel="Welcome badge"
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji} accessibilityLabel="Sparkle">
            🌟
          </Text>
          <Text style={styles.title}>Welcome to Oalethia</Text>
          <Text style={styles.subtitle}>
            You just earned your first rank: Initiate of the Compass.
          </Text>

          <View style={styles.badgeWrapper}>
            <View style={styles.badgeOuter}>
              <Image
                source={require('@/assets/badges/level1.svg')}
                style={styles.badgeImage}
                contentFit="contain"
                accessibilityLabel="Level 1 Initiate of the Compass badge"
              />
            </View>
            <Text style={styles.badgeLabel}>Level 1 · Initiate of the Compass</Text>
          </View>

          <View style={styles.steps}>
            <Text style={styles.stepsTitle}>Quick walkthrough</Text>
            <Text style={styles.stepText}>
              1. Goal – Describe what you want to achieve in the outcome field.
            </Text>
            <Text style={styles.stepText}>
              2. Context & resources – Share your current situation and time/budget/network so the plan fits your life.
            </Text>
            <Text style={styles.stepText}>
              3. Approach & timeframe – Choose how bold you want the actions to feel and how long you want to work toward this goal.
            </Text>
            <Text style={styles.stepText}>
              4. Generate – Press and hold Generate to create your first cosmic action timeline.
            </Text>
          </View>

          <GlassButton
            title="Create my first timeline"
            onPress={handlePrimary}
            style={styles.primaryButton}
            accessibilityLabel="Create my first timeline"
          />

          <Pressable
            onPress={handleDismiss}
            style={styles.secondaryLink}
            accessibilityRole="button"
            accessibilityLabel="Explore the app first"
          >
            <Text style={styles.secondaryLinkText}>Explore the app first</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: glassColors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: glassSpacing.screenPadding,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: glassBorderRadius.xl,
    padding: glassSpacing.lg,
    backgroundColor: glassColors.glass.medium,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.active,
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: glassSpacing.sm,
  },
  title: {
    ...glassTypography.h3,
    color: glassColors.text.primary,
    textAlign: 'center',
    marginBottom: glassSpacing.xs,
  },
  subtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    textAlign: 'center',
    marginBottom: glassSpacing.lg,
  },
  badgeWrapper: {
    alignItems: 'center',
    marginBottom: glassSpacing.lg,
  },
  badgeOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: glassColors.accent,
    backgroundColor: glassColors.glass.strong,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: glassSpacing.sm,
  },
  badgeImage: {
    width: 96,
    height: 96,
  },
  badgeLabel: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
  },
  steps: {
    marginBottom: glassSpacing.lg,
  },
  stepsTitle: {
    ...glassTypography.label,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.xs,
  },
  stepText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.xs,
  },
  primaryButton: {
    marginBottom: glassSpacing.sm,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: glassSpacing.xs,
  },
  secondaryLinkText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
});


import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GlassButton } from '@/components/glass';
import { useLevelUp } from '@/contexts/LevelUpContext';
import { usePointsRefresh } from '@/contexts/PointsRefreshContext';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const MIN_TOUCH_TARGET = 44;

export function LevelUpModalContent() {
  const { levelUp, clearLevelUp } = useLevelUp();
  const { invalidate } = usePointsRefresh();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (levelUp) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const delay = reduceMotion ? 0 : 200;
      const t = setTimeout(() => setShowContent(true), delay);
      return () => clearTimeout(t);
    }
    setShowContent(false);
  }, [levelUp, reduceMotion]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    invalidate();
    clearLevelUp();
  };

  if (!levelUp) return null;

  const { newLevel, levelName, previousLevel } = levelUp;

  return (
    <Modal
      visible={!!levelUp}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      accessibilityViewIsModal
      accessibilityLabel="Level up celebration"
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            showContent && !reduceMotion && styles.cardVisible,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.emoji} accessibilityLabel="Celebration">
            🎉
          </Text>
          <Text style={styles.title}>Level Up!</Text>

          <View style={styles.levelRow}>
            <Text style={styles.levelPrev}>Lv.{previousLevel}</Text>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.badgeWrap}>
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeNumber}>{newLevel}</Text>
              </View>
            </View>
            <Text style={styles.levelNew}>Lv.{newLevel}</Text>
          </View>

          <Text style={styles.levelName}>{levelName}</Text>
          <Text style={styles.message}>
            Congratulations! You've reached a new achievement level.
          </Text>

          <GlassButton
            title="Continue"
            onPress={handleContinue}
            style={styles.button}
            accessibilityLabel="Continue"
            accessibilityHint="Dismisses level up celebration"
          />
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
    maxWidth: 360,
    borderRadius: glassBorderRadius.xl,
    padding: glassSpacing.lg,
    backgroundColor: glassColors.glass.medium,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.active,
    alignItems: 'center',
    opacity: 0,
    transform: [{ scale: 0.95 }],
  },
  cardVisible: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  emoji: {
    fontSize: 48,
    marginBottom: glassSpacing.sm,
  },
  title: {
    ...glassTypography.h3,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: glassSpacing.md,
    marginVertical: glassSpacing.md,
  },
  levelPrev: {
    ...glassTypography.h4,
    color: glassColors.text.tertiary,
  },
  arrow: {
    ...glassTypography.bodyLarge,
    color: glassColors.accent,
  },
  badgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: glassColors.glass.strong,
    borderWidth: 2,
    borderColor: glassColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumber: {
    ...glassTypography.h3,
    color: glassColors.text.primary,
  },
  levelNew: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  levelName: {
    ...glassTypography.h4,
    color: glassColors.accent,
    marginBottom: glassSpacing.sm,
    textAlign: 'center',
  },
  message: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    textAlign: 'center',
    marginBottom: glassSpacing.lg,
  },
  button: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: glassSpacing.sm,
  },
});

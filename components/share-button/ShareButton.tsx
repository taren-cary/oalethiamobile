import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { glassColors, glassSpacing, glassTypography } from '@/theme';

const MIN_TOUCH = 44;

export interface ShareButtonProps {
  onShare?: (share: () => Promise<void>) => void;
  shareMessage: string;
  shareTitle?: string;
  /** If provided, opens share modal (e.g. Affirmation Share) instead of native share. */
  onOpenShareModal?: () => void;
  accessibilityLabel?: string;
}

export function ShareButton({
  onShare,
  shareMessage,
  shareTitle = 'Share',
  onOpenShareModal,
  accessibilityLabel = 'Share',
}: ShareButtonProps) {
  const performShare = useCallback(async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: shareTitle,
      });
    } catch {
      // User dismissed or share failed
    }
  }, [shareMessage, shareTitle]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onOpenShareModal) {
      onOpenShareModal();
    } else if (onShare) {
      onShare(performShare);
    } else {
      performShare();
    }
  }, [onOpenShareModal, onShare, performShare]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.wrap,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to share"
    >
      <View style={styles.content}>
        <Ionicons
          name="share-outline"
          size={22}
          color={glassColors.accent}
        />
        <Text style={styles.label}>Share</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: glassSpacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: glassSpacing.xs,
  },
  label: {
    ...glassTypography.labelSmall,
    color: glassColors.accent,
  },
});

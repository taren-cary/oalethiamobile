import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/glass';
import { useShare } from '@/contexts/ShareContext';
import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';

export function ShareModalContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { text, title, clearShare } = useShare();

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: text,
        title,
      });
      clearShare();
      router.back();
    } catch {
      // User dismissed or share failed
    }
  }, [text, title, clearShare, router]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearShare();
    router.back();
  }, [clearShare, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Share affirmation</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.quoteBox}>
          <Text style={styles.quote} numberOfLines={8}>
            "{text || 'No text to share.'}"
          </Text>
        </View>

        <GlassButton
          title="Share"
          onPress={handleShare}
          style={styles.button}
          accessibilityLabel="Share via system share"
        />
        <GlassButton
          title="Cancel"
          onPress={handleClose}
          variant="secondary"
          style={styles.button}
          accessibilityLabel="Cancel"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
  header: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingVertical: glassSpacing.md,
  },
  title: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: glassSpacing.screenPadding,
  },
  quoteBox: {
    backgroundColor: glassColors.glass.light,
    borderRadius: glassBorderRadius.lg,
    padding: glassSpacing.lg,
    marginBottom: glassSpacing.xl,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.default,
  },
  quote: {
    ...glassTypography.bodyLarge,
    color: glassColors.text.secondary,
    fontStyle: 'italic',
  },
  button: {
    marginBottom: glassSpacing.md,
  },
});

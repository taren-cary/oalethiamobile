import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassButton, GlassCard } from '@/components/glass';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

export interface AffirmationCardProps {
  text: string;
  date: string;
  affirmed: boolean;
  onAffirm: () => void;
  onShare?: () => void;
}

const TITLE = "Today's cosmic affirmation";

export function AffirmationCard({
  text,
  date,
  affirmed,
  onAffirm,
  onShare,
}: AffirmationCardProps) {
  const handleAffirm = useCallback(() => {
    if (affirmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAffirm();
  }, [affirmed, onAffirm]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare?.();
  }, [onShare]);

  return (
    <GlassCard>
      <Text style={styles.title}>{TITLE}</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.quote} numberOfLines={6}>
        "{text}"
      </Text>
      <View style={styles.actions}>
        <GlassButton
          title={affirmed ? 'Affirmed' : 'Affirm'}
          onPress={handleAffirm}
          disabled={affirmed}
          accessibilityLabel={affirmed ? 'Affirmed' : 'Confirm today’s affirmation'}
          accessibilityHint={affirmed ? undefined : 'Double tap to confirm'}
        />
        {onShare && (
          <GlassButton
            title="Share"
            onPress={handleShare}
            variant="secondary"
            accessibilityLabel="Share affirmation"
            accessibilityHint="Double tap to open share options"
          />
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.xs,
  },
  date: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.md,
  },
  quote: {
    ...glassTypography.bodyLarge,
    color: glassColors.text.secondary,
    fontStyle: 'italic',
    marginBottom: glassSpacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: glassSpacing.md,
    flexWrap: 'wrap',
  },
});

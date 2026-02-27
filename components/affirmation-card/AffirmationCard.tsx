import { Image } from 'expo-image';
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
      <View style={styles.poster}>
        <Image
          source={require('../../assets/affirmations/affirmation_test.jpg')}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.posterOverlay}>
          <Text style={styles.posterText}>
            {text}
          </Text>
        </View>
      </View>
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
  poster: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: glassSpacing.lg,
  },
  posterOverlay: {
    flex: 1,
    paddingHorizontal: glassSpacing.lg,
    paddingTop: '45%',
    alignItems: 'center',
  },
  posterText: {
    ...glassTypography.bodyLarge,
    color: glassColors.text.primary,
    textAlign: 'center',
    fontFamily: 'Times New Roman',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: glassSpacing.md,
    flexWrap: 'wrap',
  },
});

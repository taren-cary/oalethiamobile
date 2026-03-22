import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { GlassButton, GlassCard } from '@/components/glass';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

const FALLBACK_POSTER = require('../../assets/affirmations/affirmation_test.jpg');

export interface AffirmationCardProps {
  text: string;
  date: string;
  affirmed: boolean;
  onAffirm: () => void;
  onShare?: () => void;
  /** Remote URL for poster background (e.g. from today-affirmation API). Falls back to bundled image when null/undefined. */
  imageUrl?: string | null;
  /** When true, show "Affirming…" and disable the Affirm button. */
  affirmLoading?: boolean;
}

const TITLE = "Today's cosmic affirmation";

export function AffirmationCard({
  text,
  date,
  affirmed,
  onAffirm,
  onShare,
  imageUrl,
  affirmLoading = false,
}: AffirmationCardProps) {
  const posterShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const posterSource = imageUrl?.trim()
    ? { uri: imageUrl.trim() }
    : FALLBACK_POSTER;
  const handleAffirm = useCallback(() => {
    if (affirmed || affirmLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAffirm();
  }, [affirmed, affirmLoading, onAffirm]);

  const handleShare = useCallback(async () => {
    if (sharing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharing(true);
    try {
      const uri = await posterShotRef.current?.capture?.();
      if (uri) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle: "Share today's affirmation",
          });
        }
        onShare?.();
      }
    } catch {
      // User dismissed or capture/share failed
    } finally {
      setSharing(false);
    }
  }, [onShare, sharing]);

  return (
    <GlassCard>
      <Text style={styles.title}>{TITLE}</Text>
      <Text style={styles.date}>{date}</Text>
      <ViewShot
        ref={posterShotRef}
        options={{ format: 'jpg', quality: 1 }}
        style={styles.poster}
      >
        <Image
          source={posterSource}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
          accessible={false}
        />
        <View style={styles.posterOverlay}>
          <Text style={styles.posterText}>
            {text}
          </Text>
          <View style={styles.posterWatermark}>
            <Image
              source={require('../../assets/images/oalethialogowhite.svg')}
              style={styles.watermarkImage}
              contentFit="contain"
              accessible={false}
            />
          </View>
        </View>
      </ViewShot>
      <View style={styles.actions}>
        <GlassButton
          title={affirmed ? 'Affirmed' : affirmLoading ? 'Affirming…' : 'Affirm'}
          onPress={handleAffirm}
          disabled={affirmed || affirmLoading}
          accessibilityLabel={affirmed ? 'Affirmed' : 'Confirm today’s affirmation'}
          accessibilityHint={affirmed ? undefined : 'Double tap to confirm'}
        />
        {onShare && (
          <GlassButton
            title={sharing ? 'Sharing…' : 'Share'}
            onPress={handleShare}
            disabled={sharing}
            variant="secondary"
            accessibilityLabel={sharing ? 'Sharing poster' : 'Share affirmation poster'}
            accessibilityHint="Double tap to share the poster image"
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
    paddingBottom: glassSpacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posterWatermark: {
    alignSelf: 'center',
  },
  watermarkImage: {
    width: 40,
    height: 40,
    opacity: 0.35,
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

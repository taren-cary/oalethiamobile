import { Image } from 'expo-image';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { glassColors, glassSpacing, glassTypography } from '@/theme';

const FALLBACK_POSTER = require('../../assets/affirmations/affirmation_test.jpg');

export interface AffirmationPosterProps {
  text: string;
  imageUrl?: string | null;
}

export const AffirmationPoster = forwardRef<ViewShot, AffirmationPosterProps>(
  function AffirmationPoster({ text, imageUrl }, ref) {
    const posterSource = imageUrl?.trim()
      ? { uri: imageUrl.trim() }
      : FALLBACK_POSTER;

    return (
      <ViewShot
        ref={ref}
        options={{ format: 'jpg', quality: 1 }}
        style={styles.poster}
      >
        <Image
          source={posterSource}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.posterOverlay}>
          <Text style={styles.posterText}>{text}</Text>
          <View style={styles.posterWatermark}>
            <Image
              source={require('../../assets/images/oalethialogowhite.svg')}
              style={styles.watermarkImage}
              contentFit="contain"
            />
          </View>
        </View>
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  poster: {
    width: '100%',
    aspectRatio: 9 / 16,
    overflow: 'hidden',
  },
  posterOverlay: {
    flex: 1,
    paddingHorizontal: glassSpacing.lg,
    paddingTop: '45%',
    paddingBottom: glassSpacing.xl,
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
});

import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

import { glassColors, glassSpacing, glassTypography } from '@/theme';

interface CalculatingBirthChartScreenProps {
  onComplete: () => void;
}

export function CalculatingBirthChartScreen({ onComplete }: CalculatingBirthChartScreenProps) {
  useEffect(() => {
    // Random duration between 5-7 seconds for natural feel
    const duration = 5000 + Math.random() * 2000;
    const timer = setTimeout(() => {
      onComplete();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpeg')}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={300}
        accessible={false}
      />
      <View style={styles.content}>
        <LottieView
          source={require('@/assets/OalethiaSquareLogoAnimation.json')}
          autoPlay
          loop
          style={styles.animation}
        />
        <Text style={styles.text}>Calculating birth chart...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: glassSpacing.screenPadding,
  },
  animation: {
    width: 200,
    height: 200,
  },
  text: {
    ...glassTypography.h3,
    color: glassColors.text.primary,
    marginTop: glassSpacing.xl,
    textAlign: 'center',
  },
});

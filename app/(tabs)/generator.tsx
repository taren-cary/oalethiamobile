import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/glass';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

export default function GeneratorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpeg')}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={300}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + glassSpacing.md,
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        <Text style={styles.title}>Generate</Text>
        <GlassButton
          title="Create timeline"
          onPress={() => router.push({ pathname: '/modal', params: { type: 'create-timeline' } })}
          style={styles.cta}
          accessibilityLabel="Create a new timeline"
          accessibilityHint="Opens the timeline creation form"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: glassSpacing.screenPadding,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title: {
    ...glassTypography.h2,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.lg,
  },
  cta: {
    minWidth: 200,
  },
});

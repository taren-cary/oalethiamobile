import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/glass';
import { glassSpacing } from '@/theme';

export default function GeneratorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpg')}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={300}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + glassSpacing.xxl,
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        <GlassButton
          title="Create timeline"
          onPress={() => router.push('/modal')}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    minWidth: 200,
  },
});

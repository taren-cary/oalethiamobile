import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function GeneratorScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Generator</ThemedText>
      <ThemedText type="default">Creative generator coming soon.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});


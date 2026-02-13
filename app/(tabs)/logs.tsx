import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function LogsScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Logs</ThemedText>
      <ThemedText type="default">Your session logs will appear here.</ThemedText>
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


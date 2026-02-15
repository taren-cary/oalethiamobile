import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { useStripeReturnUrl } from '@/hooks/use-stripe-return-url';

export default function TabLayout() {
  useStripeReturnUrl();

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="generator" options={{ title: 'Generate' }} />
        <Tabs.Screen name="logs" options={{ title: 'Logs' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

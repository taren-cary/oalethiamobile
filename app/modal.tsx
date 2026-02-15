import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import {
  AuthModalContent,
  CreateTimelineModalContent,
  ResultsModalContent,
  ShareModalContent,
  SubscriptionModalContent,
  WelcomeModalContent,
} from '@/components/modals';
import { glassColors } from '@/theme';

type ModalType =
  | 'auth'
  | 'subscription'
  | 'credits'
  | 'share'
  | 'create-timeline'
  | 'results'
  | 'welcome';

export default function ModalScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = (params.type ?? 'auth') as ModalType;

  return (
    <View style={styles.container}>
      {type === 'auth' && <AuthModalContent />}
      {type === 'subscription' && <SubscriptionModalContent type="subscription" />}
      {type === 'credits' && <SubscriptionModalContent type="credits" />}
      {type === 'share' && <ShareModalContent />}
      {type === 'create-timeline' && <CreateTimelineModalContent />}
      {type === 'results' && <ResultsModalContent />}
      {type === 'welcome' && <WelcomeModalContent />}
      {!['auth', 'subscription', 'credits', 'share', 'create-timeline', 'results', 'welcome'].includes(type) && (
        <AuthModalContent />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
});

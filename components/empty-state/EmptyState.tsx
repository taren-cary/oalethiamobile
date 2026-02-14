import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassButton } from '@/components/glass';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

export interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const DEFAULT_ICON: React.ComponentProps<typeof Ionicons>['name'] = 'planet-outline';

export function EmptyState({
  icon = DEFAULT_ICON,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={64}
        color={glassColors.text.disabled}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <GlassButton
          title={actionLabel}
          onPress={onAction}
          accessibilityLabel={actionLabel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    marginBottom: glassSpacing.lg,
  },
  title: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
    textAlign: 'center',
    marginBottom: glassSpacing.sm,
  },
  description: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    textAlign: 'center',
    marginBottom: glassSpacing.xl,
  },
});

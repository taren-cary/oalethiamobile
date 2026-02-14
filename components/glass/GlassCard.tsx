import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { glassBorderRadius, glassColors, glassSpacing } from '@/theme';

import { GlassContainer, type GlassContainerProps } from './GlassContainer';

export interface GlassCardProps extends Omit<GlassContainerProps, 'children'> {
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
}

export function GlassCard({
  children,
  cardStyle,
  style,
  ...containerProps
}: GlassCardProps) {
  return (
    <GlassContainer style={style} gradientBorder {...containerProps}>
      <View style={[styles.card, cardStyle]}>{children}</View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: glassSpacing.cardPadding,
    borderRadius: glassBorderRadius.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});

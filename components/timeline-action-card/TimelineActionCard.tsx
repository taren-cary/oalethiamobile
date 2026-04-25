import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/components/glass';
import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';

export interface TimelineActionLink {
  title: string;
  url: string;
}

export type HistoryStatus = 'completed' | 'skipped' | 'missed';

export interface TimelineActionCardProps {
  date: string;
  action: string;
  transit: string;
  strategy?: string;
  links?: TimelineActionLink[];
  completed: boolean;
  onToggleComplete: () => void;
  onSkip?: () => void;
  staggerIndex?: number;
  reduceMotion?: boolean;
  /** When set, renders in read-only history mode — no buttons, shows status badge. */
  historyStatus?: HistoryStatus;
}

const MIN_TOUCH = 44;

const HISTORY_CONFIG: Record<HistoryStatus, { label: string; icon: string; color: string }> = {
  completed: { label: 'Completed', icon: 'checkmark-circle', color: glassColors.success },
  skipped: { label: 'Skipped', icon: 'remove-circle-outline', color: glassColors.text.tertiary },
  missed: { label: 'Missed', icon: 'close-circle-outline', color: 'rgba(239,68,68,0.7)' },
};

export function TimelineActionCard({
  date,
  action,
  transit,
  strategy,
  links,
  completed,
  onToggleComplete,
  onSkip,
  staggerIndex = 0,
  reduceMotion = false,
  historyStatus,
}: TimelineActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggleComplete = useCallback(() => {
    Haptics.selectionAsync();
    onToggleComplete();
  }, [onToggleComplete]);

  const handleToggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((e) => !e);
  }, []);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSkip();
    }
  }, [onSkip]);

  const hasExpandContent = Boolean(strategy || (links && links.length > 0));

  const entering = reduceMotion
    ? undefined
    : FadeInDown.delay(Math.min(staggerIndex * 100, 500)).springify();

  const isHistory = historyStatus != null;
  const historyCfg = historyStatus ? HISTORY_CONFIG[historyStatus] : null;

  return (
    <Animated.View entering={entering} style={isHistory && styles.historyWrapper}>
      <GlassCard>
        <View style={styles.row}>
          {isHistory ? (
            <View style={styles.checkboxWrap}>
              <Ionicons
                name={historyCfg!.icon as any}
                size={24}
                color={historyCfg!.color}
              />
            </View>
          ) : (
            <Pressable
              onPress={handleToggleComplete}
              style={({ pressed }) => [styles.checkboxWrap, pressed && styles.pressed]}
              hitSlop={8}
              accessibilityRole="checkbox"
              accessibilityLabel={completed ? 'Action completed' : 'Mark action complete'}
              accessibilityState={{ checked: completed }}
            >
              <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
                {completed && (
                  <Ionicons name="checkmark" size={20} color={glassColors.text.primary} />
                )}
              </View>
            </Pressable>
          )}
          <View style={styles.content}>
            <View style={styles.badges}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{date}</Text>
              </View>
              {isHistory && (
                <View style={[styles.statusBadge, { borderColor: historyCfg!.color }]}>
                  <Text style={[styles.statusBadgeText, { color: historyCfg!.color }]}>
                    {historyCfg!.label}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.transitBox}>
              <Text style={styles.transitLabel}>Your Cosmic Support:</Text>
              <Text style={styles.transitText}>{transit}</Text>
            </View>
            <View style={styles.actionRow}>
              <Text style={[
                styles.actionText,
                (completed || isHistory) && styles.actionCompleted,
              ]}>
                {action}
              </Text>
              {hasExpandContent && (
                <Pressable
                  onPress={handleToggleExpand}
                  style={({ pressed }) => [
                    styles.expandButton,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={8}
                  accessibilityLabel={expanded ? 'Collapse details' : 'Expand details'}
                  accessibilityState={{ expanded }}
                >
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={glassColors.accent}
                  />
                </Pressable>
              )}
            </View>
            {expanded && hasExpandContent && (
              <View style={styles.expanded}>
                {strategy && (
                  <View style={styles.strategyBlock}>
                    <Text style={styles.strategyLabel}>Strategy:</Text>
                    <Text style={styles.strategyText}>{strategy}</Text>
                  </View>
                )}
                {links && links.length > 0 && (
                  <View style={styles.linksBlock}>
                    <Text style={styles.linksLabel}>Resources:</Text>
                    {links.map((link, i) => (
                      <Pressable
                        key={i}
                        onPress={() => link.url && Linking.openURL(link.url)}
                        accessibilityRole="link"
                        accessibilityLabel={link.title}
                      >
                        <Text style={styles.linkText}>{link.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
          {!isHistory && onSkip && (
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
              accessibilityLabel="Skip this action"
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: glassSpacing.md,
  },
  checkboxWrap: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: glassBorderRadius.sm,
    borderWidth: 2,
    borderColor: glassColors.glassBorder.default,
    backgroundColor: glassColors.glass.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: glassColors.success,
    borderColor: glassColors.success,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  badges: {
    flexDirection: 'row',
    marginBottom: glassSpacing.sm,
  },
  dateBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: glassSpacing.sm,
    paddingVertical: glassSpacing.xs,
    borderRadius: glassBorderRadius.full,
  },
  dateText: {
    ...glassTypography.labelSmall,
    color: glassColors.text.primary,
  },
  transitBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: glassBorderRadius.md,
    padding: glassSpacing.sm,
    marginBottom: glassSpacing.sm,
  },
  transitLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.accent,
    marginBottom: 2,
  },
  transitText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: glassSpacing.sm,
  },
  actionText: {
    ...glassTypography.body,
    color: glassColors.text.primary,
    flex: 1,
  },
  actionCompleted: {
    color: glassColors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  expandButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expanded: {
    marginTop: glassSpacing.md,
    paddingTop: glassSpacing.md,
    borderTopWidth: 1,
    borderTopColor: glassColors.glassBorder.subtle,
  },
  strategyBlock: {
    marginBottom: glassSpacing.sm,
  },
  strategyLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 4,
  },
  strategyText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
  },
  linksBlock: {},
  linksLabel: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: 4,
  },
  linkText: {
    ...glassTypography.bodySmall,
    color: glassColors.accent,
    marginBottom: 2,
  },
  skipButton: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: glassSpacing.sm,
  },
  skipText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
  historyWrapper: {
    opacity: 0.75,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: glassBorderRadius.full,
    paddingHorizontal: glassSpacing.sm,
    paddingVertical: glassSpacing.xs,
    marginLeft: glassSpacing.xs,
  },
  statusBadgeText: {
    ...glassTypography.labelSmall,
  },
});

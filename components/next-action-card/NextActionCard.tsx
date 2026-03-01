import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CountdownTimer } from '@/components/CountdownTimer';
import { GlassCard } from '@/components/glass';
import { parseActionDate } from '@/lib/parseActionDate';
import type { TimelineAction } from '@/types/timeline';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const MIN_TOUCH = 44;

/** Map action to link list for resources section */
function actionToLinks(action: TimelineAction): Array<{ title: string; url: string }> {
  const links: Array<{ title: string; url: string }> = [];
  action.articles?.forEach((a) => links.push({ title: a.title, url: a.url }));
  return links;
}

function actionStrategy(action: TimelineAction): string | undefined {
  if (action.strategy) return action.strategy;
  if (action.strategies?.length) return action.strategies.join('\n\n');
  return undefined;
}

export interface NextActionCardProps {
  timelineId: string;
  outcome: string;
  action: TimelineAction;
  actionIndex: number;
  completed: boolean;
  onToggleComplete: () => void;
  onSkip: () => void;
  onViewTimeline: () => void;
  pulse?: boolean;
  reduceMotion?: boolean;
}

export function NextActionCard({
  timelineId,
  outcome,
  action,
  actionIndex,
  completed,
  onToggleComplete,
  onSkip,
  onViewTimeline,
  pulse = true,
  reduceMotion = false,
}: NextActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const targetDate = parseActionDate(action.date);
  const strategy = actionStrategy(action);
  const links = actionToLinks(action);
  const hasExpandContent = Boolean(strategy || links.length > 0);

  const pulseValue = useSharedValue(0);
  useEffect(() => {
    if (!pulse || reduceMotion) return;
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, [pulse, reduceMotion, pulseValue]);

  const animatedPulseStyle = useAnimatedStyle(() => {
    'worklet';
    const t = pulseValue.value;
    return {
      shadowOpacity: 0.3 + t * 0.3,
      shadowRadius: 16 + t * 8,
      borderColor: interpolateColor(
        t,
        [0, 1],
        ['rgba(251, 191, 36, 0.5)', 'rgba(251, 191, 36, 0.75)']
      ),
    };
  });

  const handleToggleComplete = useCallback(() => {
    Haptics.selectionAsync();
    onToggleComplete();
  }, [onToggleComplete]);

  const handleToggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((e) => !e);
  }, []);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  }, [onSkip]);

  const cardContent = (
    <View style={styles.row}>
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
      <View style={styles.content}>
        <View style={styles.badgesRow}>
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>NEXT ACTION</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{action.date}</Text>
          </View>
          <CountdownTimer targetDate={targetDate} compact />
        </View>
        <Text style={styles.outcomeLabel} numberOfLines={1}>
          Goal: {outcome}
        </Text>
        <View style={styles.transitBox}>
          <Text style={styles.transitLabel}>Your Cosmic Support:</Text>
          <Text style={styles.transitText}>{action.transit}</Text>
        </View>
        <View style={styles.actionRow}>
          <Text style={[styles.actionText, completed && styles.actionCompleted]}>
            {action.action}
          </Text>
          {hasExpandContent && (
            <Pressable
              onPress={handleToggleExpand}
              style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
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
            {links.length > 0 && (
              <View style={styles.linksBlock}>
                <Text style={styles.linksLabel}>Resources:</Text>
                {links.map((link, i) => (
                  <Pressable
                    key={i}
                    onPress={() => link.url && Linking.openURL(link.url)}
                    style={({ pressed }) => [pressed && styles.pressed]}
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
        <View style={styles.footer}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            accessibilityLabel="Skip this action"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <Pressable
            onPress={onViewTimeline}
            style={({ pressed }) => [styles.viewTimelineButton, pressed && styles.pressed]}
            accessibilityLabel="View full timeline"
          >
            <Text style={styles.viewTimelineText}>View timeline</Text>
            <Ionicons name="chevron-forward" size={16} color={glassColors.accent} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const innerCard = (
    <View style={styles.amberBorder}>
      <GlassCard blur="medium" cardStyle={styles.innerCardContent}>
        {cardContent}
      </GlassCard>
    </View>
  );

  if (pulse && !reduceMotion) {
    return (
      <Animated.View style={[styles.pulseWrapper, animatedPulseStyle]}>
        {innerCard}
      </Animated.View>
    );
  }

  return <View style={styles.pulseWrapper}>{innerCard}</View>;
}

const styles = StyleSheet.create({
  pulseWrapper: {
    borderRadius: glassBorderRadius.card + 2,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  amberBorder: {
    borderRadius: glassBorderRadius.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
  },
  innerCardContent: {
    backgroundColor: 'rgba(251, 193, 7, 0.04)',
  },
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: glassSpacing.sm,
    marginBottom: glassSpacing.sm,
  },
  nextBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.45)',
    paddingHorizontal: glassSpacing.sm,
    paddingVertical: glassSpacing.xs,
    borderRadius: glassBorderRadius.full,
  },
  nextBadgeText: {
    ...glassTypography.labelSmall,
    color: glassColors.text.primary,
    fontWeight: '700',
  },
  dateBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    paddingHorizontal: glassSpacing.sm,
    paddingVertical: glassSpacing.xs,
    borderRadius: glassBorderRadius.full,
  },
  dateText: {
    ...glassTypography.labelSmall,
    color: glassColors.text.primary,
  },
  outcomeLabel: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.sm,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: glassSpacing.md,
    paddingTop: glassSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: glassColors.glassBorder.subtle,
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
  viewTimelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: glassSpacing.xs,
    paddingHorizontal: glassSpacing.sm,
  },
  viewTimelineText: {
    ...glassTypography.labelSmall,
    color: glassColors.accent,
  },
});

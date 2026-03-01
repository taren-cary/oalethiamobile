import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { glassColors, glassTypography } from '@/theme';

export interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  compact?: boolean;
}

export function CountdownTimer({
  targetDate,
  onComplete,
  compact = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    total: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const target = targetDate.getTime();
      const diff = target - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ days, hours, minutes, total: diff });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, total: 0 });
        onComplete?.();
      }
    };

    calculate();
    const interval = setInterval(calculate, 60 * 1000);
    return () => clearInterval(interval);
  }, [targetDate.getTime(), onComplete]);

  const format = (n: number) => String(n).padStart(2, '0');

  if (timeLeft.total <= 0) {
    return (
      <View style={[compact ? styles.compact : styles.full, styles.expired]}>
        <Text style={styles.expiredText}>Time's up!</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.compactEmoji}>⏰</Text>
        <Text style={styles.compactNumbers}>
          {timeLeft.days > 0 && (
            <>
              <Text style={styles.compactBold}>{format(timeLeft.days)}d</Text>
              <Text style={styles.compactMuted}> : </Text>
            </>
          )}
          <Text style={styles.compactBold}>{format(timeLeft.hours)}h</Text>
          <Text style={styles.compactMuted}> : </Text>
          <Text style={styles.compactBold}>{format(timeLeft.minutes)}m</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <Text style={styles.label}>Complete by end of day</Text>
      <View style={styles.unitsRow}>
        {timeLeft.days > 0 && (
          <>
            <View style={styles.unit}>
              <Text style={styles.unitValue}>{format(timeLeft.days)}</Text>
              <Text style={styles.unitLabel}>d</Text>
            </View>
            <Text style={styles.sep}>:</Text>
          </>
        )}
        <View style={styles.unit}>
          <Text style={styles.unitValue}>{format(timeLeft.hours)}</Text>
          <Text style={styles.unitLabel}>h</Text>
        </View>
        <Text style={styles.sep}>:</Text>
        <View style={styles.unit}>
          <Text style={styles.unitValue}>{format(timeLeft.minutes)}</Text>
          <Text style={styles.unitLabel}>m</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactEmoji: {
    fontSize: 12,
  },
  compactNumbers: {
    ...glassTypography.bodySmall,
  },
  compactBold: {
    ...glassTypography.labelSmall,
    color: glassColors.text.primary,
  },
  compactMuted: {
    color: glassColors.text.tertiary,
  },
  expired: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  expiredText: {
    ...glassTypography.labelSmall,
    color: glassColors.error,
  },
  full: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.default,
  },
  label: {
    ...glassTypography.labelSmall,
    color: glassColors.text.secondary,
    marginBottom: 8,
  },
  unitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  unit: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  unitValue: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
  },
  unitLabel: {
    fontSize: 10,
    color: glassColors.text.tertiary,
    marginTop: 2,
  },
  sep: {
    ...glassTypography.body,
    color: glassColors.text.tertiary,
  },
});

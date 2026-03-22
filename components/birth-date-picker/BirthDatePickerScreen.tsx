import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// View doesn't expose onAccessibilityIncrement/Decrement in the TS definitions for this RN
// version, so we cast to ComponentType<any> for the adjustable picker wrappers.
const AdjustableView = View as React.ComponentType<any>;

import { GlassButton } from '@/components/glass/GlassButton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface BirthDatePickerScreenProps {
  onDone: () => void;
  onSkip?: () => void;
}

export function BirthDatePickerScreen({ onDone, onSkip }: BirthDatePickerScreenProps) {
  const insets = useSafeAreaInsets();
  const { setBirthDate } = useOnboarding();
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const [monthIndex, setMonthIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(25);

  const monthRef = useRef<ScrollView>(null);
  const dayRef = useRef<ScrollView>(null);
  const yearRef = useRef<ScrollView>(null);

  const year = years[yearIndex] ?? currentYear - 25;
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const dayIndexClamped = Math.min(dayIndex, daysInMonth - 1);
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const handleMonthScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, MONTHS.length - 1));
    if (clamped !== monthIndex) setMonthIndex(clamped);
  }, [monthIndex]);

  const handleDayScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, days.length - 1));
    if (clamped !== dayIndex) setDayIndex(clamped);
  }, [dayIndex, days.length]);

  const handleYearScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, years.length - 1));
    if (clamped !== yearIndex) setYearIndex(clamped);
  }, [yearIndex, years.length]);

  const dayValue = days[dayIndexClamped] ?? 1;

  const handleDone = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const yearVal = years[yearIndex] ?? currentYear - 25;
    const dateStr = `${yearVal}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`;
    setBirthDate(dateStr);
    onDone();
  }, [onDone, setBirthDate, years, yearIndex, monthIndex, dayValue, currentYear]);

  const handleSkip = useCallback(() => {
    if (!onSkip) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  }, [onSkip]);

  useEffect(() => {
    const t = setTimeout(() => {
      monthRef.current?.scrollTo({ y: monthIndex * ITEM_HEIGHT, animated: false });
      dayRef.current?.scrollTo({ y: dayIndexClamped * ITEM_HEIGHT, animated: false });
      yearRef.current?.scrollTo({ y: yearIndex * ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (dayIndex > daysInMonth - 1) setDayIndex(daysInMonth - 1);
  }, [daysInMonth, dayIndex]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: glassSpacing.screenPadding,
        },
      ]}
    >
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpeg')}
        style={styles.backgroundImage}
        contentFit="cover"
        accessible={false}
      />

      <View style={styles.cardWrap}>
        <LinearGradient
          colors={glassColors.gradientBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <BlurView intensity={1} tint="light" style={styles.glassCard}>
            <View style={styles.headerRow}>
              {onSkip && (
                <Pressable
                  onPress={handleSkip}
                  hitSlop={12}
                  style={({ pressed }) => [styles.skipButton, pressed && styles.skipPressed]}
                  accessibilityLabel="Skip birth info"
                >
                  <Text style={styles.skipText}>Skip</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.title}>Enter your birth date</Text>
            <Text style={styles.subtitle}>
              We use this to map your transits and plan your cosmic actions.
            </Text>

            <View style={styles.pickerRow}>
              <AdjustableView
                accessible={true}
                accessibilityRole="adjustable"
                accessibilityLabel="Month"
                accessibilityValue={{ text: MONTHS[monthIndex] }}
                onAccessibilityIncrement={() => {
                  const next = Math.min(monthIndex + 1, MONTHS.length - 1);
                  setMonthIndex(next);
                  monthRef.current?.scrollTo({ y: next * ITEM_HEIGHT, animated: true });
                }}
                onAccessibilityDecrement={() => {
                  const next = Math.max(monthIndex - 1, 0);
                  setMonthIndex(next);
                  monthRef.current?.scrollTo({ y: next * ITEM_HEIGHT, animated: true });
                }}
                style={styles.pickerColumn}
              >
                <ScrollView
                  ref={monthRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMonthScroll}
                  onScrollEndDrag={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    setMonthIndex(Math.max(0, Math.min(index, MONTHS.length - 1)));
                  }}
                  contentContainerStyle={styles.pickerContent}
                  accessible={false}
                >
                  {MONTHS.map((m, i) => (
                    <View key={m} style={styles.pickerItem} accessible={false}>
                      <Text style={[styles.pickerText, i === monthIndex && styles.pickerTextActive]}>
                        {m}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </AdjustableView>
              <AdjustableView
                accessible={true}
                accessibilityRole="adjustable"
                accessibilityLabel="Day"
                accessibilityValue={{ text: String(dayValue) }}
                onAccessibilityIncrement={() => {
                  const next = Math.min(dayIndex + 1, days.length - 1);
                  setDayIndex(next);
                  dayRef.current?.scrollTo({ y: next * ITEM_HEIGHT, animated: true });
                }}
                onAccessibilityDecrement={() => {
                  const next = Math.max(dayIndex - 1, 0);
                  setDayIndex(next);
                  dayRef.current?.scrollTo({ y: next * ITEM_HEIGHT, animated: true });
                }}
                style={styles.pickerColumn}
              >
                <ScrollView
                  ref={dayRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleDayScroll}
                  onScrollEndDrag={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    setDayIndex(Math.max(0, Math.min(index, days.length - 1)));
                  }}
                  contentContainerStyle={styles.pickerContent}
                  accessible={false}
                >
                  {days.map((d) => (
                    <View key={d} style={styles.pickerItem} accessible={false}>
                      <Text style={[styles.pickerText, d === dayValue && styles.pickerTextActive]}>
                        {d}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </AdjustableView>
              <AdjustableView
                accessible={true}
                accessibilityRole="adjustable"
                accessibilityLabel="Year"
                accessibilityValue={{ text: String(year) }}
                onAccessibilityIncrement={() => {
                  const next = Math.min(yearIndex + 1, years.length - 1);
                  setYearIndex(next);
                  yearRef.current?.scrollTo({ y: next * ITEM_HEIGHT, animated: true });
                }}
                onAccessibilityDecrement={() => {
                  const next = Math.max(yearIndex - 1, 0);
                  setYearIndex(next);
                  yearRef.current?.scrollTo({ y: next * ITEM_HEIGHT, animated: true });
                }}
                style={styles.pickerColumn}
              >
                <ScrollView
                  ref={yearRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleYearScroll}
                  onScrollEndDrag={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    setYearIndex(Math.max(0, Math.min(index, years.length - 1)));
                  }}
                  contentContainerStyle={styles.pickerContent}
                  accessible={false}
                >
                  {years.map((y) => (
                    <View key={y} style={styles.pickerItem} accessible={false}>
                      <Text style={[styles.pickerText, y === year && styles.pickerTextActive]}>
                        {y}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </AdjustableView>
            </View>

            <GlassButton
              title="Done"
              onPress={handleDone}
              accessibilityLabel="Continue"
              style={styles.doneButton}
            />
          </BlurView>
        </LinearGradient>
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
  cardWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  cardGradient: {
    padding: 1,
    borderRadius: glassBorderRadius.card,
  },
  glassCard: {
    padding: glassSpacing.cardPadding,
    borderRadius: glassBorderRadius.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: glassSpacing.xs,
  },
  title: {
    ...glassTypography.h2,
    color: '#fbbf24',
    marginBottom: glassSpacing.sm,
  },
  subtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: PICKER_HEIGHT,
    marginBottom: glassSpacing.lg,
  },
  pickerColumn: {
    height: PICKER_HEIGHT,
    flex: 1,
    maxWidth: 120,
  },
  pickerContent: {
    paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    ...glassTypography.bodyLarge,
    color: glassColors.text.tertiary,
  },
  pickerTextActive: {
    color: glassColors.text.primary,
    ...glassTypography.h4,
  },
  doneButton: {
    marginTop: glassSpacing.xs,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipPressed: {
    opacity: 0.8,
  },
  skipText: {
    ...glassTypography.label,
    color: glassColors.text.secondary,
  },
});

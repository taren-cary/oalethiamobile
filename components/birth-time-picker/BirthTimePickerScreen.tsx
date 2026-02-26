import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/glass/GlassButton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const AMPM = ['AM', 'PM'] as const;

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Default 12:00 PM -> hourIndex 0 (12), minuteIndex 0 (0), ampmIndex 1 (PM)
const DEFAULT_HOUR_INDEX = 0;
const DEFAULT_MINUTE_INDEX = 0;
const DEFAULT_AMPM_INDEX = 1;

interface BirthTimePickerScreenProps {
  onDone: () => void;
  onSkip?: () => void;
}

export function BirthTimePickerScreen({ onDone, onSkip }: BirthTimePickerScreenProps) {
  const insets = useSafeAreaInsets();
  const { setBirthTime } = useOnboarding();
  const [hourIndex, setHourIndex] = useState(DEFAULT_HOUR_INDEX);
  const [minuteIndex, setMinuteIndex] = useState(DEFAULT_MINUTE_INDEX);
  const [ampmIndex, setAmpmIndex] = useState(DEFAULT_AMPM_INDEX);

  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);
  const ampmRef = useRef<ScrollView>(null);

  const hour = HOURS_12[hourIndex] ?? 12;
  const minute = MINUTES[minuteIndex] ?? 0;
  const ampm = AMPM[ampmIndex];

  const handleHourScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, HOURS_12.length - 1));
    if (clamped !== hourIndex) setHourIndex(clamped);
  }, [hourIndex]);

  const handleMinuteScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, MINUTES.length - 1));
    if (clamped !== minuteIndex) setMinuteIndex(clamped);
  }, [minuteIndex]);

  const handleAmpmScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, AMPM.length - 1));
    if (clamped !== ampmIndex) setAmpmIndex(clamped);
  }, [ampmIndex]);

  const handleUseDefault = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHourIndex(DEFAULT_HOUR_INDEX);
    setMinuteIndex(DEFAULT_MINUTE_INDEX);
    setAmpmIndex(DEFAULT_AMPM_INDEX);
    const t = setTimeout(() => {
      hourRef.current?.scrollTo({ y: DEFAULT_HOUR_INDEX * ITEM_HEIGHT, animated: true });
      minuteRef.current?.scrollTo({ y: DEFAULT_MINUTE_INDEX * ITEM_HEIGHT, animated: true });
      ampmRef.current?.scrollTo({ y: DEFAULT_AMPM_INDEX * ITEM_HEIGHT, animated: true });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleDone = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const h = hour === 12 ? (ampm === 'AM' ? 0 : 12) : (ampm === 'PM' ? hour + 12 : hour);
    const timeStr = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    setBirthTime(timeStr);
    onDone();
  }, [onDone, setBirthTime, hour, minute, ampm]);

  const handleSkip = useCallback(() => {
    if (!onSkip) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  }, [onSkip]);

  useEffect(() => {
    const t = setTimeout(() => {
      hourRef.current?.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
      minuteRef.current?.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
      ampmRef.current?.scrollTo({ y: ampmIndex * ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, []);

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
                  style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
                  accessibilityLabel="Skip birth info"
                >
                  <Text style={styles.skipText}>Skip</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.title}>Enter your birth time</Text>
            <Text style={styles.subtitle}>
              Used for accurate chart placement. Defaults to 12:00 PM if unknown.
            </Text>

            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <ScrollView
                  ref={hourRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleHourScroll}
                  onScrollEndDrag={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    setHourIndex(Math.max(0, Math.min(index, HOURS_12.length - 1)));
                  }}
                  contentContainerStyle={styles.pickerContent}
                >
                  {HOURS_12.map((h, i) => (
                    <View key={h} style={styles.pickerItem}>
                      <Text style={[styles.pickerText, i === hourIndex && styles.pickerTextActive]}>
                        {h}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
                <ScrollView
                  ref={minuteRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinuteScroll}
                  onScrollEndDrag={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    setMinuteIndex(Math.max(0, Math.min(index, MINUTES.length - 1)));
                  }}
                  contentContainerStyle={styles.pickerContent}
                >
                  {MINUTES.map((m, i) => (
                    <View key={m} style={styles.pickerItem}>
                      <Text style={[styles.pickerText, i === minuteIndex && styles.pickerTextActive]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={[styles.pickerColumn, styles.ampmColumn]}>
                <ScrollView
                  ref={ampmRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleAmpmScroll}
                  onScrollEndDrag={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    setAmpmIndex(Math.max(0, Math.min(index, AMPM.length - 1)));
                  }}
                  contentContainerStyle={styles.pickerContent}
                >
                  {AMPM.map((a, i) => (
                    <View key={a} style={styles.pickerItem}>
                      <Text style={[styles.pickerText, i === ampmIndex && styles.pickerTextActive]}>
                        {a}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable
              onPress={handleUseDefault}
              style={({ pressed }) => [styles.defaultLink, pressed && styles.pressed]}
              accessibilityLabel="Use 12:00 PM as default"
            >
              <Text style={styles.defaultLinkText}>I don’t know my birth time → use 12:00 PM</Text>
            </Pressable>

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
    marginBottom: glassSpacing.sm,
  },
  pickerColumn: {
    height: PICKER_HEIGHT,
    flex: 1,
    maxWidth: 80,
  },
  ampmColumn: {
    maxWidth: 72,
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
  defaultLink: {
    alignSelf: 'center',
    marginBottom: glassSpacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  defaultLinkText: {
    ...glassTypography.body,
    color: glassColors.accent,
  },
  doneButton: {
    marginTop: glassSpacing.xs,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    ...glassTypography.label,
    color: glassColors.text.secondary,
  },
});

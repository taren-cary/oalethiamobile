import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

import { AffirmationPoster } from './AffirmationPoster';
import { GlassButton, GlassCard } from '@/components/glass';
import type { TodayAffirmationItem } from '@/lib/homeUtils';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

const TITLE = "Today's cosmic affirmation";

export interface SwipeableAffirmationCardProps {
  items: TodayAffirmationItem[];
  date: string;
  onAffirm: (item: TodayAffirmationItem) => void;
  onShare?: () => void;
  /** Timeline ID whose Affirm request is in progress (shows "Affirming…" for that item when it's current). */
  affirmLoadingId?: string | null;
}

export function SwipeableAffirmationCard({
  items,
  date,
  onAffirm,
  onShare,
  affirmLoadingId = null,
}: SwipeableAffirmationCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [posterWidth, setPosterWidth] = useState(0);
  const posterRefs = useRef<Record<number, React.ElementRef<typeof ViewShot> | null>>({});
  const listRef = useRef<FlatList<TodayAffirmationItem> | null>(null);
  const currentIndexRef = useRef(0);
  const isScrollingProgrammaticallyRef = useRef(false);

  currentIndexRef.current = currentIndex;

  const onPosterListLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setPosterWidth(w);
  }, []);

  const currentItem = items[currentIndex];
  const affirmed = currentItem?.affirmed ?? false;
  const affirmLoading = currentItem
    ? affirmLoadingId === currentItem.timelineId
    : false;

  const handleAffirm = useCallback(() => {
    if (affirmed || affirmLoading || !currentItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAffirm(currentItem);
  }, [affirmed, affirmLoading, currentItem, onAffirm]);

  const handleShare = useCallback(async () => {
    if (sharing || !currentItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharing(true);
    try {
      const ref = posterRefs.current[currentIndex];
      const uri = await ref?.capture?.();
      if (uri) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle: "Share today's affirmation",
          });
        }
        onShare?.();
      }
    } catch {
      // User dismissed or capture/share failed
    } finally {
      setSharing(false);
    }
  }, [currentIndex, onShare, sharing]);

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      if (posterWidth <= 0) return;
      if (isScrollingProgrammaticallyRef.current) {
        isScrollingProgrammaticallyRef.current = false;
        return;
      }
      const offsetX = e.nativeEvent.contentOffset.x;
      const landedIndex = Math.round(offsetX / posterWidth);
      const bounded = Math.max(0, Math.min(items.length - 1, landedIndex));
      const latestIndex = currentIndexRef.current;
      const nextIndex =
        bounded > latestIndex + 1
          ? latestIndex + 1
          : bounded < latestIndex - 1
            ? latestIndex - 1
            : bounded;
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      if (nextIndex !== bounded) {
        isScrollingProgrammaticallyRef.current = true;
        listRef.current?.scrollToOffset({
          offset: nextIndex * posterWidth,
          animated: true,
        });
      }
    },
    [items.length, posterWidth]
  );

  const renderPoster = useCallback(
    ({ item, index }: { item: TodayAffirmationItem; index: number }) => (
      <View style={[styles.posterSlot, { width: posterWidth }]}>
        <AffirmationPoster
          ref={(r) => {
            posterRefs.current[index] = r;
          }}
          text={item.affirmationText}
          imageUrl={item.imageUrl}
        />
      </View>
    ),
    [posterWidth]
  );

  return (
    <GlassCard>
      <Text style={styles.title}>{TITLE}</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.hint}>
        Swipe for more affirmations ({items.length} today)
      </Text>
      <View style={styles.posterListWrapper} onLayout={onPosterListLayout}>
        {posterWidth > 0 && (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.timelineId}
            renderItem={renderPoster}
            horizontal
            pagingEnabled
            snapToInterval={posterWidth}
            snapToAlignment="start"
            decelerationRate={0.92}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={(_, index) => ({
              length: posterWidth,
              offset: index * posterWidth,
              index,
            })}
            style={[styles.posterList, { width: posterWidth }]}
          />
        )}
      </View>
      <View style={styles.actions}>
        <GlassButton
          title={
            affirmed ? 'Affirmed' : affirmLoading ? 'Affirming…' : 'Affirm'
          }
          onPress={handleAffirm}
          disabled={affirmed || affirmLoading}
          accessibilityLabel={
            affirmed ? 'Affirmed' : 'Confirm today’s affirmation'
          }
        />
        {onShare && (
          <GlassButton
            title={sharing ? 'Sharing…' : 'Share'}
            onPress={handleShare}
            disabled={sharing}
            variant="secondary"
            accessibilityLabel="Share affirmation poster"
          />
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...glassTypography.h5,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.xs,
  },
  date: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.sm,
  },
  hint: {
    ...glassTypography.labelSmall,
    color: glassColors.text.tertiary,
    marginBottom: glassSpacing.sm,
  },
  posterListWrapper: {
    width: '100%',
    marginBottom: glassSpacing.lg,
  },
  posterList: {},
  posterSlot: {},
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: glassSpacing.md,
    flexWrap: 'wrap',
  },
});

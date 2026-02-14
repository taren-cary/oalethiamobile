import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassContainer } from '@/components/glass';
import { glassColors, glassSpacing, glassTypography } from '@/theme';

export interface LevelData {
  level: number;
  levelName: string;
  lifetimePoints: number;
  pointsForNextLevel: number | null;
  pointsNeeded: number;
  progressPercent: number;
  isMaxLevel: boolean;
}

export interface PointsLevelBadgeProps {
  levelData: LevelData;
  showProgressBar?: boolean;
  compact?: boolean;
}

export function PointsLevelBadge({
  levelData,
  showProgressBar = true,
  compact = false,
}: PointsLevelBadgeProps) {
  const { level, levelName, progressPercent, pointsNeeded, isMaxLevel } =
    levelData;

  return (
    <GlassContainer>
      <View style={[styles.inner, compact && styles.innerCompact]}>
        <View style={styles.textBlock}>
          <Text style={styles.levelText} numberOfLines={1}>
            Level {level}: {levelName}
          </Text>
          {showProgressBar && !isMaxLevel && (
            <>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={glassColors.progressBar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.pointsToNext}>
                {pointsNeeded.toLocaleString()} points to next level
              </Text>
            </>
          )}
          {showProgressBar && isMaxLevel && (
            <Text style={styles.maxLevel}>Max level achieved</Text>
          )}
        </View>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  inner: {
    padding: glassSpacing.cardPadding,
  },
  innerCompact: {
    padding: glassSpacing.sm,
  },
  textBlock: {
    minWidth: 0,
  },
  levelText: {
    ...glassTypography.label,
    color: glassColors.text.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: glassColors.glass.light,
    overflow: 'hidden',
    marginTop: glassSpacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  pointsToNext: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: glassSpacing.xs,
  },
  maxLevel: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: glassSpacing.xs,
  },
});

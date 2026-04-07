import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_ROUTES = [
  {
    route: '/(tabs)' as const,
    segment: 'index',
    activeIcon: 'planet' as const,
    inactiveIcon: 'planet-outline' as const,
    label: 'Home',
  },
  {
    route: '/(tabs)/generator' as const,
    segment: 'generator',
    activeIcon: 'sparkles' as const,
    inactiveIcon: 'sparkles-outline' as const,
    label: 'Generate',
  },
  {
    route: '/(tabs)/logs' as const,
    segment: 'logs',
    activeIcon: 'document-text' as const,
    inactiveIcon: 'document-text-outline' as const,
    label: 'Logs',
  },
  {
    route: '/(tabs)/profile' as const,
    segment: 'profile',
    activeIcon: 'person-circle' as const,
    inactiveIcon: 'person-circle-outline' as const,
    label: 'Profile',
  },
] as const;

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACTIVE_COLOR = '#06b6d4';
const INACTIVE_COLOR = 'rgba(255,255,255,0.45)';
const ACTIVE_BG = 'rgba(6,182,212,0.15)';
const NAV_HEIGHT = 64;
const FADE_HEIGHT = 60;

// ─── Animated tab button ──────────────────────────────────────────────────────

type TabButtonProps = {
  route: string;
  segment: string;
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  isActive: boolean;
  onPress: () => void;
};

function TabButton({ activeIcon, inactiveIcon, label, isActive, onPress }: TabButtonProps) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(isActive ? 1 : 0);

  bgOpacity.value = withTiming(isActive ? 1 : 0, { duration: 200 });

  const animatedBubble = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [{ scale: isActive ? withSpring(1.1, { damping: 12 }) : withSpring(1) }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 14 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={styles.tabButton}
      hitSlop={8}
    >
      <Animated.View style={[styles.activeBubble, animatedBubble]} />
      <Animated.View style={animatedIcon}>
        <Ionicons
          name={isActive ? activeIcon : inactiveIcon}
          size={24}
          color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isActive = (segment: string) => {
    if (segment === 'index') {
      return (
        pathname === '/(tabs)' ||
        pathname === '/(tabs)/' ||
        pathname === '/' ||
        pathname.endsWith('/index') ||
        pathname.endsWith('(tabs)')
      );
    }
    return pathname.includes(segment);
  };

  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View
      style={[styles.root, { paddingBottom: bottomPad }]}
      pointerEvents="box-none"
    >
      {/*
        Layer 1 — Gradient fade
        Spans the entire root view (fade zone + bar).
        Fully transparent at top, dark at bottom.
        pointerEvents="none" so touches pass through the fade zone.
      */}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.45)',
          'rgba(0,0,0,0.65)',
        ]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/*
        Layer 2 — BlurView
        Sits ONLY over the nav bar area (bottom portion).
        Key fixes vs previous version:
          • NO overflow: 'hidden'  ← this caused the solid grey box
          • NO backgroundColor    ← let the blur be fully see-through
          • Positioned at bottom, height = bar only
      */}
      <BlurView
        intensity={55}
        tint="dark"
        style={[
          styles.blurLayer,
          { height: NAV_HEIGHT + bottomPad },
        ]}
      />

      {/* Layer 3 — Hairline top border */}
      <View
        style={[
          styles.topBorder,
          { bottom: NAV_HEIGHT + bottomPad },
        ]}
      />

      {/* Layer 4 — Tab buttons (always on top, always tappable) */}
      <View style={[styles.tabRow, { height: NAV_HEIGHT }]}>
        {TAB_ROUTES.map((tab) => (
          <TabButton
            key={tab.segment}
            {...tab}
            isActive={isActive(tab.segment)}
            onPress={() => router.push(tab.route)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FADE_HEIGHT + NAV_HEIGHT + 40,
    justifyContent: 'flex-end',
  },

  blurLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // ⚠️ No overflow, no backgroundColor — critical for transparency
  },

  topBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },

  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },

  activeBubble: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    backgroundColor: ACTIVE_BG,
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
});
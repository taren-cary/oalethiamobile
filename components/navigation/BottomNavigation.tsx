import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircularNavButton } from './CircularNavButton';

const TAB_ROUTES = [
  {
    route: '/(tabs)' as const,
    segment: 'index',
    activeIcon: 'planet',
    inactiveIcon: 'planet-outline',
  },
  {
    route: '/(tabs)/generator' as const,
    segment: 'generator',
    activeIcon: 'sparkles',
    inactiveIcon: 'sparkles-outline',
  },
  {
    route: '/(tabs)/logs' as const,
    segment: 'logs',
    activeIcon: 'document-text',
    inactiveIcon: 'document-text-outline',
  },
  {
    route: '/(tabs)/profile' as const,
    segment: 'profile',
    activeIcon: 'person-circle',
    inactiveIcon: 'person-circle-outline',
  },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isActive = (_route: string, segment: string) => {
    if (segment === 'index') {
      return pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname === '/' || pathname.endsWith('/index') || pathname.endsWith('(tabs)');
    }
    return pathname.includes(segment);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 20) },
      ]}
      pointerEvents="box-none"
    >
      {TAB_ROUTES.map(({ route, segment, activeIcon, inactiveIcon }) => {
        const active = isActive(route, segment);

        return (
          <CircularNavButton
            key={segment}
            isActive={active}
            onPress={() => router.push(route)}
          >
            <Ionicons
              name={active ? activeIcon : inactiveIcon}
              size={24}
              color={active ? '#06b6d4' : 'rgba(255, 255, 255, 0.6)'}
            />
          </CircularNavButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

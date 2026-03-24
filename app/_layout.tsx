import {
  Orbitron_500Medium,
  Orbitron_600SemiBold,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  Roboto_400Regular,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import {
  Teko_400Regular,
  Teko_700Bold,
} from '@expo-google-fonts/teko';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';
import { View, type ColorSchemeName } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { OnboardingScreen, getOnboardingStorageKey } from '@/components/onboarding';
import { BirthDatePickerScreen } from '@/components/birth-date-picker/BirthDatePickerScreen';
import { BirthTimePickerScreen } from '@/components/birth-time-picker/BirthTimePickerScreen';
import { BirthLocationPickerScreen } from '@/components/birth-location-picker/BirthLocationPickerScreen';
import { AuthScreen } from '@/components/auth';
import { AnimatedSplashScreen } from '@/components/splash';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { GenerationResultProvider } from '@/contexts/GenerationResultContext';
import { LevelUpProvider } from '@/contexts/LevelUpContext';
import { PointsRefreshProvider } from '@/contexts/PointsRefreshContext';
import { ShareProvider } from '@/contexts/ShareContext';
import { LevelUpModalContent, WelcomeBadgeModalContent } from '@/components/modals';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    KionaRegular: require('@/assets/fonts/Kiona-Regular.ttf'),
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Roboto_400Regular,
    Roboto_700Bold,
    Teko_400Regular,
    Teko_700Bold,
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          {showAnimatedSplash && (
            <AnimatedSplashScreen
              onFinish={() => setShowAnimatedSplash(false)}
            />
          )}
          {!showAnimatedSplash && (
            <OnboardingProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <AppShell colorScheme={colorScheme} />
                </SubscriptionProvider>
              </AuthProvider>
            </OnboardingProvider>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

interface AppShellProps {
  colorScheme: ColorSchemeName;
}

function AppShell({ colorScheme }: AppShellProps) {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [birthDateDone, setBirthDateDone] = useState(false);
  const [birthTimeDone, setBirthTimeDone] = useState(false);
  const [birthLocationDone, setBirthLocationDone] = useState(false);
  const [authDone, setAuthDone] = useState(false);
  const [showWelcomeBadge, setShowWelcomeBadge] = useState(false);
  const hasCheckedWelcomeBadgeRef = useRef(false);

  const { user, isFirstTimeUser, loading } = useAuth();
  const router = useRouter();

  // Navigate to home when user taps any notification (affirmation or next action reminders).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/');
    });
    return () => sub.remove();
  }, [router]);

  // Load onboarding completion flag once per device.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = getOnboardingStorageKey();
        const stored = await AsyncStorage.getItem(key);
        if (!cancelled && stored === 'true') {
          setOnboardingComplete(true);
        }
      } catch {
        // ignore storage errors; default to showing onboarding
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // If a logged-in user already has birth data, skip onboarding and birth wizard.
  useEffect(() => {
    if (loading) return;
    if (user && !isFirstTimeUser) {
      setOnboardingComplete(true);
      setBirthDateDone(true);
      setBirthTimeDone(true);
      setBirthLocationDone(true);
      setAuthDone(true);
    }
  }, [user, isFirstTimeUser, loading]);

  const handleOnboardingFinish = useCallback((opts: { skipped: boolean }) => {
    setOnboardingComplete(true);
    const key = getOnboardingStorageKey();
    AsyncStorage.setItem(key, 'true').catch(() => {
      // ignore
    });
    // We intentionally ignore opts.skipped for birth data:
    // all real accounts must go through the birth wizard.
  }, []);

  const handleBirthDateDone = useCallback(() => {
    setBirthDateDone(true);
  }, []);

  const handleBirthTimeDone = useCallback(() => {
    setBirthTimeDone(true);
  }, []);

  const handleBirthLocationDone = useCallback(() => {
    setBirthLocationDone(true);
  }, []);

  const handleAuthDone = useCallback(() => {
    setAuthDone(true);
  }, []);

  // After auth completes, decide whether to show the Level 1 welcome badge
  // for this user (only if they haven't seen it before).
  useEffect(() => {
    if (!user) return;
    if (!authDone) return;
    if (hasCheckedWelcomeBadgeRef.current) return;
    hasCheckedWelcomeBadgeRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const key = `@oalethia/welcome_badge_seen_${user.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (cancelled) return;
        const alreadySeen = stored === 'true';
        if (!alreadySeen) {
          setShowWelcomeBadge(true);
        }
      } catch {
        if (!cancelled) {
          setShowWelcomeBadge(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authDone]);

  const markWelcomeBadgeSeen = useCallback(async () => {
    if (!user) return;
    try {
      const key = `@oalethia/welcome_badge_seen_${user.id}`;
      await AsyncStorage.setItem(key, 'true');
    } catch {
      // ignore
    }
  }, [user]);

  const handleWelcomePrimary = useCallback(async () => {
    setShowWelcomeBadge(false);
    await markWelcomeBadgeSeen();
    router.push('/(tabs)/generator');
  }, [markWelcomeBadgeSeen, router]);

  const handleWelcomeDismiss = useCallback(async () => {
    setShowWelcomeBadge(false);
    await markWelcomeBadgeSeen();
  }, [markWelcomeBadgeSeen]);

  return (
    <>
      {!onboardingComplete && <OnboardingScreen onFinish={handleOnboardingFinish} />}
      {onboardingComplete && !birthDateDone && (
        <BirthDatePickerScreen onDone={handleBirthDateDone} />
      )}
      {onboardingComplete && birthDateDone && !birthTimeDone && (
        <BirthTimePickerScreen onDone={handleBirthTimeDone} />
      )}
      {onboardingComplete && birthDateDone && birthTimeDone && !birthLocationDone && (
        <BirthLocationPickerScreen onDone={handleBirthLocationDone} />
      )}
      {onboardingComplete && birthDateDone && birthTimeDone && birthLocationDone && !authDone && (
        <AuthScreen onDone={handleAuthDone} />
      )}
      {onboardingComplete && birthDateDone && birthTimeDone && birthLocationDone && authDone && (
        <>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <PointsRefreshProvider>
              <LevelUpProvider>
                <GenerationResultProvider>
                  <ShareProvider>
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="timeline/[id]"
                        options={{
                          headerShown: true,
                          title: 'Timeline',
                          headerBackTitle: 'Logs',
                          headerStyle: { backgroundColor: '#0a0a0f' },
                          headerTintColor: '#ffffff',
                          headerShadowVisible: false,
                        }}
                      />
                      <Stack.Screen
                        name="modal"
                        options={{
                          presentation: 'modal',
                          headerShown: false,
                        }}
                      />
                    </Stack>
                    <LevelUpModalContent />
                    <WelcomeBadgeModalContent
                      visible={showWelcomeBadge}
                      onPrimary={handleWelcomePrimary}
                      onDismiss={handleWelcomeDismiss}
                    />
                  </ShareProvider>
                </GenerationResultProvider>
              </LevelUpProvider>
            </PointsRefreshProvider>
          </ThemeProvider>
        </>
      )}
    </>
  );
}

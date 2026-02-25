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
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingScreen } from '@/components/onboarding';
import { BirthDatePickerScreen } from '@/components/birth-date-picker/BirthDatePickerScreen';
import { BirthTimePickerScreen } from '@/components/birth-time-picker/BirthTimePickerScreen';
import { BirthLocationPickerScreen } from '@/components/birth-location-picker/BirthLocationPickerScreen';
import { AnimatedSplashScreen } from '@/components/splash';
import { AuthProvider } from '@/contexts/AuthContext';
import { GenerationResultProvider } from '@/contexts/GenerationResultContext';
import { LevelUpProvider } from '@/contexts/LevelUpContext';
import { PointsRefreshProvider } from '@/contexts/PointsRefreshContext';
import { ShareProvider } from '@/contexts/ShareContext';
import { LevelUpModalContent } from '@/components/modals/LevelUpModalContent';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [birthDateDone, setBirthDateDone] = useState(false);
  const [birthTimeDone, setBirthTimeDone] = useState(false);
  const [birthLocationDone, setBirthLocationDone] = useState(false);

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

  const handleOnboardingFinish = useCallback((opts: { skipped: boolean }) => {
    setOnboardingComplete(true);
    if (opts.skipped) {
      setBirthDateDone(true);
      setBirthTimeDone(true);
      setBirthLocationDone(true);
    }
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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        {showAnimatedSplash && (
          <AnimatedSplashScreen
            onFinish={() => setShowAnimatedSplash(false)}
          />
        )}
        {!showAnimatedSplash && !onboardingComplete && (
          <OnboardingScreen onFinish={handleOnboardingFinish} />
        )}
        {!showAnimatedSplash && onboardingComplete && !birthDateDone && (
          <BirthDatePickerScreen onDone={handleBirthDateDone} />
        )}
        {!showAnimatedSplash && onboardingComplete && birthDateDone && !birthTimeDone && (
          <BirthTimePickerScreen onDone={handleBirthTimeDone} />
        )}
        {!showAnimatedSplash && onboardingComplete && birthDateDone && birthTimeDone && !birthLocationDone && (
          <BirthLocationPickerScreen onDone={handleBirthLocationDone} />
        )}
        {!showAnimatedSplash && onboardingComplete && birthDateDone && birthTimeDone && birthLocationDone && (
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <AuthProvider>
              <PointsRefreshProvider>
                <LevelUpProvider>
                  <GenerationResultProvider>
                    <ShareProvider>
                      <Stack>
                        <Stack.Screen
                          name="(tabs)"
                          options={{ headerShown: false }}
                        />
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
                    </ShareProvider>
                  </GenerationResultProvider>
                </LevelUpProvider>
              </PointsRefreshProvider>
            </AuthProvider>
          </ThemeProvider>
        )}
      </View>
    </SafeAreaProvider>
  );
}

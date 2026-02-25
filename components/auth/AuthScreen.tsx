import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassTextInput } from '@/components/glass';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

type AuthMode = 'signup' | 'login';

interface AuthScreenProps {
  onDone: () => void;
}

export function AuthScreen({ onDone }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  const handleToggleMode = useCallback(() => {
    Haptics.selectionAsync();
    setMode((prev) => (prev === 'signup' ? 'login' : 'signup'));
  }, []);

  const handleSubmit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Design-only: no real auth yet, just continue
    onDone();
  }, [onDone]);

  const handleDevBypass = useCallback(() => {
    Haptics.selectionAsync();
    onDone();
  }, [onDone]);

  const isSignup = mode === 'signup';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.logoWrap}>
                <Image
                  source={require('@/assets/images/oalethialogowhite.svg')}
                  style={styles.logo}
                  contentFit="contain"
                />
              </View>

              <Text style={styles.title}>
                {isSignup ? 'Take command of your future' : 'Welcome back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignup
                  ? 'Create an account to access your cosmic timelines anywhere.'
                  : 'Log in to access your saved timelines and crew leaderboard.'}
              </Text>

              <View style={styles.modeToggleRow}>
                <Pressable
                  onPress={() => setMode('signup')}
                  style={[
                    styles.modeChip,
                    isSignup && styles.modeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      isSignup && styles.modeChipTextActive,
                    ]}
                  >
                    Sign up
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode('login')}
                  style={[
                    styles.modeChip,
                    !isSignup && styles.modeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      !isSignup && styles.modeChipTextActive,
                    ]}
                  >
                    Log in
                  </Text>
                </Pressable>
              </View>

              {isSignup ? (
                <>
                  <GlassTextInput
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="choose_your_username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Username"
                  />
                  <GlassTextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email"
                  />
                  <GlassTextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    accessibilityLabel="Password"
                  />
                </>
              ) : (
                <>
                  <GlassTextInput
                    label="Username or email"
                    value={loginId}
                    onChangeText={setLoginId}
                    placeholder="your@email.com or username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Username or email"
                  />
                  <GlassTextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    accessibilityLabel="Password"
                  />
                </>
              )}

              <GlassButton
                title={isSignup ? 'Create account' : 'Log in'}
                onPress={handleSubmit}
                accessibilityLabel={isSignup ? 'Create account' : 'Log in'}
                style={styles.primaryButton}
              />

              <Pressable
                onPress={handleToggleMode}
                style={styles.switchWrap}
                accessibilityRole="button"
                accessibilityLabel={
                  isSignup ? 'Switch to log in' : 'Switch to sign up'
                }
              >
                <Text style={styles.switchText}>
                  {isSignup
                    ? 'Already have an account? Log in'
                    : "Don't have an account? Sign up"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDevBypass}
                style={styles.devBypass}
                accessibilityRole="button"
                accessibilityLabel="Skip auth and continue to app"
              >
                <Text style={styles.devBypassText}>
                  Skip auth and continue (dev only)
                </Text>
              </Pressable>
            </ScrollView>
          </BlurView>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: glassSpacing.lg,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: glassSpacing.lg,
  },
  logo: {
    width: 180,
    height: 90,
  },
  modeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  modeChip: {
    paddingVertical: 8,
    paddingHorizontal: glassSpacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'transparent',
  },
  modeChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  modeChipText: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
  },
  modeChipTextActive: {
    color: glassColors.text.primary,
  },
  title: {
    ...glassTypography.h2,
    color: '#fbbf24',
    marginBottom: glassSpacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    textAlign: 'center',
    marginBottom: glassSpacing.lg,
  },
  primaryButton: {
    marginTop: glassSpacing.sm,
    marginBottom: glassSpacing.lg,
  },
  switchWrap: {
    marginTop: glassSpacing.sm,
    paddingVertical: glassSpacing.xs,
  },
  switchText: {
    ...glassTypography.body,
    color: glassColors.accent,
    textAlign: 'center',
  },
  devBypass: {
    marginTop: glassSpacing.lg,
    alignSelf: 'center',
  },
  devBypassText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    textAlign: 'center',
  },
});


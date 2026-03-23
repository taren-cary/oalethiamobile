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
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/lib/supabase';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const USERNAME_MIN = 3;
const PASSWORD_MIN = 6;

type AuthMode = 'signup' | 'login';

interface AuthScreenProps {
  onDone: () => void;
}

export function AuthScreen({ onDone }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { signUp, signIn } = useAuth();
  const {
    birthDate,
    birthTime,
    location,
    latitude,
    longitude,
    hasBirthData,
  } = useOnboarding();

  const [mode, setMode] = useState<AuthMode>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleMode = useCallback(() => {
    Haptics.selectionAsync();
    setMode((prev) => (prev === 'signup' ? 'login' : 'signup'));
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');

    if (mode === 'signup') {
      const un = username.trim().toLowerCase();
      if (un.length < USERNAME_MIN) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (password.length < PASSWORD_MIN) {
        setError(`Password must be at least ${PASSWORD_MIN} characters`);
        return;
      }
      setLoading(true);
      try {
        const result = await signUp(email.trim(), password, un);
        if (result.error) {
          setError(result.error.message);
          setLoading(false);
          return;
        }
        if (result.user && hasBirthData && birthDate && location) {
          const timeStr = birthTime.trim() || '12:00';
          const { error: chartError } = await supabase.from('birth_charts').upsert(
            {
              user_id: result.user.id,
              birth_date: birthDate.trim(),
              birth_time: timeStr,
              location: location.trim(),
              latitude,
              longitude,
              planets: {},
              houses: {},
              ascendant: 0,
              mc: 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
          if (chartError) {
            setError('Account created but failed to save birth data. You can add it later in settings.');
            setLoading(false);
            return;
          }
        }
        const signInResult = await signIn(email.trim(), password);
        if (signInResult.error) {
          setError('Account created. Please sign in with your email and password.');
          setLoading(false);
          return;
        }
        onDone();
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      const loginEmail = loginId.trim();
      if (!loginEmail || !password) {
        setError('Please enter your email and password');
        return;
      }
      setLoading(true);
      try {
        const result = await signIn(loginEmail, password);
        if (result.error) {
          setError(result.error.message);
          setLoading(false);
          return;
        }
        onDone();
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [
    mode,
    username,
    email,
    loginId,
    password,
    signUp,
    signIn,
    onDone,
    hasBirthData,
    birthDate,
    birthTime,
    location,
    latitude,
    longitude,
  ]);

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
                  accessible={false}
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
                  accessibilityRole="tab"
                  accessibilityLabel="Sign up"
                  accessibilityState={{ selected: isSignup }}
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
                  accessibilityRole="tab"
                  accessibilityLabel="Log in"
                  accessibilityState={{ selected: !isSignup }}
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
                    label="Email"
                    value={loginId}
                    onChangeText={(t) => { setLoginId(t); setError(''); }}
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
              )}

              {error ? (
                <View style={styles.errorWrap}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <GlassButton
                title={loading ? (isSignup ? 'Creating…' : 'Signing in…') : (isSignup ? 'Create account' : 'Log in')}
                onPress={handleSubmit}
                disabled={loading}
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
  errorWrap: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: glassBorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  errorText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.primary,
    textAlign: 'center',
  },
});


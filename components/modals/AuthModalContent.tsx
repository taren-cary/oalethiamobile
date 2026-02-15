import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassTextInput } from '@/components/glass';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const PASSWORD_MIN = 6;

export function AuthModalContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pendingPostAuth = useRef(false);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        const un = username.trim().toLowerCase();
        if (un.length < USERNAME_MIN) {
          setError('Username must be at least 3 characters long');
          setLoading(false);
          return;
        }
        if (!USERNAME_REGEX.test(un)) {
          setError('Username can only contain letters, numbers, and underscores');
          setLoading(false);
          return;
        }
        const result = await signUp(email, password, un);
        if (result.error) {
          setError(result.error.message);
          setLoading(false);
          return;
        }
        setSuccess('Account created! Signing you in…');
        const signInResult = await signIn(email, password);
        if (signInResult.error) {
          setError('Account created but sign in failed. Please sign in manually.');
          setLoading(false);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        pendingPostAuth.current = true;
        setEmail('');
        setPassword('');
        setUsername('');
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error.message);
          setLoading(false);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        pendingPostAuth.current = true;
        setEmail('');
        setPassword('');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, username, signIn, signUp, router]);

  useEffect(() => {
    if (!user || !pendingPostAuth.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('birth_charts')
          .select('birth_date, birth_time, location')
          .eq('user_id', user.id)
          .single();
        const isFirstTime = !data || !data.birth_date || !data.location;
        if (cancelled) return;
        pendingPostAuth.current = false;
        router.back();
        if (isFirstTime) {
          setTimeout(() => {
            router.push({ pathname: '/modal', params: { type: 'welcome' } });
          }, 300);
        }
      } catch {
        if (!cancelled) {
          pendingPostAuth.current = false;
          router.back();
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user, router]);

  const toggleMode = useCallback(() => {
    Haptics.selectionAsync();
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setSuccess('');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === 'signup' ? 'Create account' : 'Welcome back'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={12}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {mode === 'signup'
            ? 'Join and save your cosmic timelines.'
            : 'Sign in to access your saved timelines.'}
        </Text>

        {mode === 'signup' && (
          <GlassTextInput
            label="Username"
            value={username}
            onChangeText={(t) => setUsername(t.trim().toLowerCase())}
            placeholder="choose_your_username"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={USERNAME_MAX}
            accessibilityLabel="Username"
          />
        )}

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

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <GlassButton
          title={loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityLabel={mode === 'signup' ? 'Create account' : 'Sign in'}
        />

        <Pressable
          onPress={toggleMode}
          style={styles.switchWrap}
          accessibilityRole="button"
          accessibilityLabel={mode === 'signup' ? 'Switch to sign in' : 'Switch to sign up'}
        >
          <Text style={styles.switchText}>
            {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: glassColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: glassSpacing.screenPadding,
    paddingVertical: glassSpacing.md,
  },
  title: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 28,
    color: glassColors.text.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingBottom: glassSpacing.xxl,
  },
  subtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: glassBorderRadius.md,
    padding: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  errorText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.primary,
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderRadius: glassBorderRadius.md,
    padding: glassSpacing.sm,
    marginBottom: glassSpacing.md,
  },
  successText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.primary,
  },
  switchWrap: {
    marginTop: glassSpacing.lg,
    paddingVertical: glassSpacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  switchText: {
    ...glassTypography.body,
    color: glassColors.accent,
    textAlign: 'center',
  },
});

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassCard } from '@/components/glass';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/lib/api';
import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';

type SubscriptionType = 'subscription' | 'credits';

export function SubscriptionModalContent({ type }: { type: SubscriptionType }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = useCallback(async () => {
    if (!session) {
      setError('Please sign in first.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint =
        type === 'subscription'
          ? '/api/create-checkout-session'
          : '/api/create-credits-checkout';
      const body =
        type === 'subscription'
          ? { priceId: 'price_1SX5ZNACtGGEAl9EbA1wVA0A' }
          : { priceId: 'price_1SX5YsACtGGEAl9EitsVNsN3', credits: 3 };

      const res = await apiPost(endpoint, session, body);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || 'Failed to create checkout session';
        if (msg.toLowerCase().includes('unauthorized') || res.status === 401) {
          setError('Your session expired. Please sign in again.');
        } else if (res.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(msg);
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      const url = data.url;
      if (url) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { openBrowserAsync } = await import('expo-web-browser');
        await openBrowserAsync(url);
        router.back();
      } else {
        setError('No checkout URL returned.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Network error. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [type, session, router]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'subscription' ? 'Upgrade to Premium' : 'Buy extra credits'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {type === 'subscription' ? (
          <>
            <GlassCard cardStyle={styles.card}>
              <Text style={styles.cardTitle}>Premium features</Text>
              <Text style={styles.bullet}>• 10 timeline generations per month</Text>
              <Text style={styles.bullet}>• All timeframes (1–12 months)</Text>
              <Text style={styles.bullet}>• See all action details</Text>
              <Text style={styles.bullet}>• Priority support</Text>
            </GlassCard>
            <GlassCard cardStyle={styles.priceCard}>
              <Text style={styles.price}>$9.99</Text>
              <Text style={styles.priceSub}>per month</Text>
            </GlassCard>
          </>
        ) : (
          <>
            <GlassCard cardStyle={styles.card}>
              <Text style={styles.cardBody}>
                Get 3 extra timeline generations for a one-time payment.
              </Text>
            </GlassCard>
            <GlassCard cardStyle={styles.priceCard}>
              <Text style={styles.price}>$2.99</Text>
              <Text style={styles.priceSub}>one-time purchase</Text>
            </GlassCard>
          </>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GlassButton
          title="Cancel"
          onPress={handleClose}
          variant="secondary"
          style={styles.button}
          disabled={loading}
          accessibilityLabel="Cancel"
        />
        <GlassButton
          title={loading ? 'Loading…' : 'Continue to checkout'}
          onPress={handleCheckout}
          style={styles.button}
          disabled={loading}
          accessibilityLabel="Continue to checkout"
        />
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
    paddingHorizontal: glassSpacing.screenPadding,
    paddingVertical: glassSpacing.md,
  },
  title: {
    ...glassTypography.h4,
    color: glassColors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: glassSpacing.screenPadding,
    paddingBottom: glassSpacing.xxl,
  },
  card: {
    marginBottom: glassSpacing.md,
  },
  cardTitle: {
    ...glassTypography.label,
    color: glassColors.text.primary,
    marginBottom: glassSpacing.sm,
  },
  cardBody: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
  },
  bullet: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
    marginBottom: 4,
  },
  priceCard: {
    marginBottom: glassSpacing.lg,
    alignItems: 'center',
  },
  price: {
    ...glassTypography.h3,
    color: glassColors.text.primary,
  },
  priceSub: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    marginTop: 4,
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
  button: {
    marginBottom: glassSpacing.md,
  },
});

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassCard } from '@/components/glass';
import { useAuth } from '@/contexts/AuthContext';
import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';
import { IapService, type PurchaseResult } from '@/iap/IapService';

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
      let result: PurchaseResult;
      if (type === 'subscription') {
        result = await IapService.buySubscriptionMonthly();
      } else {
        result = await IapService.buyCredits3Pack();
      }

      if (!result.ok) {
        if (result.cancelled) {
          // user cancelled; no need to show an error
        } else if (result.errorMessage) {
          setError(result.errorMessage);
        } else {
          setError('Purchase failed. Please try again.');
        }
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
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

  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL('https://oalethia.com/privacy').catch(() => {});
  }, []);

  const openTerms = useCallback(() => {
    Linking.openURL('https://oalethia.com/terms').catch(() => {});
  }, []);

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

        {type === 'subscription' && (
          <View style={styles.legalBox}>
            <Text style={styles.legalText}>
              Subscription automatically renews monthly at $9.99 unless cancelled at least 24 hours
              before the end of the current period. Renewal will be charged to your Apple ID account.
              Manage or cancel at any time in{' '}
              <Text style={styles.legalBold}>Settings → [Your Name] → Subscriptions</Text>.
            </Text>
          </View>
        )}

        <View style={styles.legalLinks}>
          <Pressable
            onPress={openPrivacyPolicy}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
            hitSlop={8}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalSeparator}>·</Text>
          <Pressable
            onPress={openTerms}
            accessibilityRole="link"
            accessibilityLabel="Terms of Service"
            hitSlop={8}
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
        </View>

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
  legalBox: {
    marginBottom: glassSpacing.md,
  },
  legalText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalBold: {
    color: glassColors.text.secondary,
    fontWeight: '600' as const,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: glassSpacing.lg,
    gap: 6,
  },
  legalLink: {
    ...glassTypography.bodySmall,
    color: glassColors.accent,
    textDecorationLine: 'underline' as const,
  },
  legalSeparator: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
});

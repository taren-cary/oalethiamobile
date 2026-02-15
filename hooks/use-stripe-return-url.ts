import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Handles Stripe return / success deep links so the app can refresh after
 * checkout or customer portal. Backend should redirect to e.g.:
 * - oalethiamobile://?success=true (subscription checkout)
 * - oalethiamobile://?credits=true (credits checkout)
 * - oalethiamobile://?portal=returned (customer portal)
 * When any of these are received, we navigate to Profile so the user sees
 * updated subscription/credits (and any refetch can happen there).
 */
export function useStripeReturnUrl() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = Linking.parse(url);
        const q = (parsed.queryParams ?? {}) as Record<string, string>;
        const success = q.success === 'true';
        const credits = q.credits === 'true';
        const portal = q.portal === 'returned';
        if (success || credits || portal) {
          router.replace('/(tabs)/profile');
        }
      } catch {
        // Ignore parse errors
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { IapService, configureRevenueCat } from '@/iap/IapService';
import { apiGet } from '@/lib/api';
import { subscribeToIapUpdates } from '@/lib/iapEvents';

export interface SubscriptionTier {
  id?: string;
  name: string;
  monthlyCredits: number;
  maxTimeframe: number;
  canSeeAllActions: boolean;
  priceMonthly?: number;
  priceYearly?: number;
}

export interface SubscriptionContextType {
  tier: SubscriptionTier | null;
  credits: number | null;
  isFree: boolean;
  status: string;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const FREE_TIER_DEFAULTS: SubscriptionTier = {
  name: 'free',
  monthlyCredits: 3,
  maxTimeframe: 3,
  canSeeAllActions: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { session } = useAuth();

  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isFree, setIsFree] = useState(true);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent double-fetching on rapid session changes.
  const fetchingRef = useRef(false);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const refreshSubscription = useCallback(async () => {
    if (!session) return;
    try {
      const res = await apiGet('/api/user-subscription', session);
      if (!sessionRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (!sessionRef.current) return;
        const raw = data.tier ?? {};
        setTier({
          id: raw.id,
          name: raw.name ?? 'free',
          monthlyCredits: raw.monthly_credits ?? 3,
          maxTimeframe: raw.max_timeframe ?? 3,
          canSeeAllActions: raw.can_see_all_actions ?? false,
          priceMonthly: raw.price_monthly,
          priceYearly: raw.price_yearly,
        });
        setIsFree(data.isFree ?? true);
        setStatus(data.status ?? 'active');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load subscription');
    }
  }, [session]);

  const refreshCredits = useCallback(async () => {
    if (!session) return;
    try {
      const res = await apiGet('/api/credits', session);
      if (!sessionRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (!sessionRef.current) return;
        setCredits(data.credits ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load credits');
    }
  }, [session]);

  // Full fetch: subscription + credits together. Used on mount and after purchases.
  const fetchAll = useCallback(async () => {
    if (!session || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      await IapService.syncOwnedEntitlements();
      if (!sessionRef.current) {
        fetchingRef.current = false;
        return;
      }
      await Promise.all([refreshSubscription(), refreshCredits()]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [session, refreshSubscription, refreshCredits]);

  // Fetch on mount and whenever the session changes (login / logout).
  useEffect(() => {
    if (!session) {
      setTier(FREE_TIER_DEFAULTS);
      setCredits(null);
      setIsFree(true);
      setStatus('active');
      setLoading(false);
      return;
    }
    configureRevenueCat(session.user.id);
    fetchAll();
  }, [session, fetchAll]);

  // Re-fetch whenever a purchase or restore completes (emitted by IapService).
  // The webhook that updates the DB fires asynchronously after the purchase, so
  // we do an immediate fetch + a delayed fetch to catch the webhook-driven update.
  useEffect(() => {
    let delayedTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeToIapUpdates(() => {
      fetchAll();
      delayedTimer = setTimeout(() => {
        Promise.all([refreshSubscription(), refreshCredits()]).catch(() => {});
      }, 4000);
    });
    return () => {
      unsubscribe();
      if (delayedTimer) clearTimeout(delayedTimer);
    };
  }, [fetchAll, refreshSubscription, refreshCredits]);

  // On every foreground transition: sync StoreKit entitlements then re-fetch.
  // This keeps subscription state fresh after the user manages a subscription
  // in the App Store settings and returns to the app.
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appState.current === 'background' ||
        appState.current === 'inactive';
      const isNowActive = nextState === 'active';

      appState.current = nextState;

      if (wasBackground && isNowActive && session) {
        // Best-effort: don't block the UI if StoreKit is slow.
        IapService.syncOwnedEntitlements()
          .then(() => fetchAll())
          .catch(() => {
            // syncOwnedEntitlements already handles errors internally.
            fetchAll();
          });
      }
    });
    return () => sub.remove();
  }, [session, fetchAll]);

  const value: SubscriptionContextType = {
    tier,
    credits,
    isFree,
    status,
    loading,
    error,
    refreshSubscription,
    refreshCredits,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const ctx = useContext(SubscriptionContext);
  if (ctx === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}

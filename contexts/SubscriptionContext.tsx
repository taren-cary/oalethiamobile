import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';

interface SubscriptionTier {
  name: string;
  monthlyCredits: number;
  maxTimeframe: number;
  canSeeAllActions: boolean;
}

interface SubscriptionState {
  tier: SubscriptionTier | null;
  isFree: boolean;
  status: 'active' | 'canceled' | 'past_due' | 'none';
  credits: number | null;
  loading: boolean;
  error?: string;
}

interface SubscriptionContextValue extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

const DEFAULT_TIER: SubscriptionTier = {
  name: 'free',
  monthlyCredits: 3,
  maxTimeframe: 3,
  canSeeAllActions: false,
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [isFree, setIsFree] = useState(true);
  const [status, setStatus] = useState<'active' | 'canceled' | 'past_due' | 'none'>('none');
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const refreshSubscription = useCallback(async () => {
    if (!session) {
      setTier(DEFAULT_TIER);
      setIsFree(true);
      setStatus('none');
      return;
    }
    try {
      setLoading(true);
      setError(undefined);
      const res = await apiGet('/api/user-subscription', session);
      if (!res.ok) {
        setTier(DEFAULT_TIER);
        setIsFree(true);
        setStatus('active');
        return;
      }
      const data = await res.json();
      const apiTier = data.tier ?? {};
      const mappedTier: SubscriptionTier = {
        name: apiTier.name ?? 'free',
        monthlyCredits: apiTier.monthly_credits ?? (apiTier.name === 'premium' ? 10 : 3),
        maxTimeframe: apiTier.max_timeframe ?? (apiTier.name === 'premium' ? 12 : 3),
        canSeeAllActions: apiTier.can_see_all_actions ?? apiTier.name === 'premium',
      };
      setTier(mappedTier);
      setIsFree(data.isFree ?? mappedTier.name === 'free');
      setStatus(data.status ?? 'active');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load subscription');
      setTier(DEFAULT_TIER);
      setIsFree(true);
      setStatus('active');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const refreshCredits = useCallback(async () => {
    if (!session) {
      setCredits(null);
      return;
    }
    try {
      const res = await apiGet('/api/credits', session);
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.credits === 'number') {
        setCredits(data.credits);
      }
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setTier(DEFAULT_TIER);
      setIsFree(true);
      setStatus('none');
      setCredits(null);
      return;
    }
    refreshSubscription();
    refreshCredits();
  }, [session, refreshSubscription, refreshCredits]);

  const value: SubscriptionContextValue = {
    tier: tier ?? DEFAULT_TIER,
    isFree,
    status,
    credits,
    loading,
    error,
    refreshSubscription,
    refreshCredits,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}


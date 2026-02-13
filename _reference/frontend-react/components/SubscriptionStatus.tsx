'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionTier {
  name: string;
  monthly_credits: number;
  max_timeframe: number;
  can_see_all_actions: boolean;
  price_monthly: number;
  price_yearly: number;
}

interface SubscriptionData {
  tier: SubscriptionTier;
  status: string;
  current_period_end?: string;
  isFree: boolean;
}

interface SubscriptionStatusProps {
  onUpgrade: () => void;
  onBuyCredits: () => void;
}

export default function SubscriptionStatus({ onUpgrade, onBuyCredits }: SubscriptionStatusProps) {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (user && session) {
      fetchSubscriptionData();
      fetchCredits();
    } else {
      setLoading(false);
    }
  }, [user, session]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-subscription`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card bg-blue-500/20 border-blue-400/50 p-4">
        <div className="text-center">
          <h4 className="text-white font-semibold mb-2">🌟 Sign Up for More Features</h4>
          <p className="text-white/80 text-sm mb-3">
            Get 3 free timeline generations per month and save your progress!
          </p>
          <div className="text-white/60 text-xs">
            Anonymous users: 1 generation per month
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="glass-card bg-yellow-500/20 border-yellow-400/50 p-4">
        <p className="text-white text-sm">Loading subscription data...</p>
      </div>
    );
  }

  const isPremium = subscription.tier.name === 'premium';
  const isFree = subscription.isFree;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-white font-semibold">
            {isPremium ? '⭐ Premium Plan' : '🆓 Free Plan'}
          </h4>
          <p className="text-white/80 text-sm">
            {credits} credit{credits !== 1 ? 's' : ''} remaining
          </p>
        </div>
        {isFree && (
          <button
            onClick={onUpgrade}
            className="glass-button bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40 text-sm px-3 py-1"
          >
            Upgrade
          </button>
        )}
      </div>

      <div className="space-y-2 text-xs text-white/70">
        <div className="flex justify-between">
          <span>Monthly Credits:</span>
          <span>{subscription.tier.monthly_credits}</span>
        </div>
        <div className="flex justify-between">
          <span>Max Timeframe:</span>
          <span>{subscription.tier.max_timeframe} months</span>
        </div>
        <div className="flex justify-between">
          <span>All Actions Visible:</span>
          <span>{subscription.tier.can_see_all_actions ? '✅' : '❌'}</span>
        </div>
      </div>

      {isFree && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex gap-2">
            <button
              onClick={onUpgrade}
              className="flex-1 glass-button bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40 text-sm py-2"
            >
              Upgrade to Premium
            </button>
            <button
              onClick={onBuyCredits}
              className="flex-1 glass-button bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/40 text-sm py-2"
            >
              Buy Credits
            </button>
          </div>
        </div>
      )}

      {isPremium && subscription.current_period_end && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-white/60 text-xs text-center">
            Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

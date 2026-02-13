'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'subscription' | 'credits';
}

export default function SubscriptionModal({ isOpen, onClose, type }: SubscriptionModalProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = type === 'subscription' 
        ? '/api/create-checkout-session'
        : '/api/create-credits-checkout';
      
      const body = type === 'subscription'
        ? { priceId: 'price_1SX5ZNACtGGEAl9EbA1wVA0A' } // Your subscription price ID
        : { priceId: 'price_1SX5YsACtGGEAl9EitsVNsN3', credits: 3 }; // Replace with your credits price ID
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to create checkout session';
        
        // Handle specific payment errors
        if (errorMessage.toLowerCase().includes('card') || errorMessage.toLowerCase().includes('declined')) {
          throw new Error('Your card was declined. Please check your card details or try a different payment method.');
        } else if (errorMessage.toLowerCase().includes('insufficient') || errorMessage.toLowerCase().includes('funds')) {
          throw new Error('Insufficient funds. Please check your account balance or use a different payment method.');
        } else if (errorMessage.toLowerCase().includes('expired')) {
          throw new Error('Your card has expired. Please use a different payment method.');
        } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else if (errorMessage.toLowerCase().includes('timeout')) {
          throw new Error('Request timed out. Please try again in a moment.');
        } else if (response.status === 401 || errorMessage.toLowerCase().includes('unauthorized')) {
          throw new Error('Your session has expired. Please sign in again and try again.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again in a few moments. If the problem persists, contact support.');
        } else {
          throw new Error(errorMessage);
        }
      }

      const { url } = await response.json();
      // Redirect to Stripe Checkout
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
    } catch (err: any) {
      // Capture payment error in Sentry
      Sentry.captureException(err, {
        tags: {
          error_type: 'payment_checkout',
          payment_type: type,
        },
        extra: {
          endpoint: type === 'subscription' ? '/api/create-checkout-session' : '/api/create-credits-checkout',
        },
      });
      
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again or contact support if the problem persists.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {type === 'subscription' ? 'Upgrade to Premium' : 'Buy Extra Credits'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {type === 'subscription' ? (
          <>
            <div className="space-y-4 mb-6">
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Premium Features:</h3>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>✓ 10 timeline generations per month</li>
                  <li>✓ All timeframes (1-12 months)</li>
                  <li>✓ See all action details</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-lg border border-purple-400/30">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">$9.99</div>
                  <div className="text-white/80 text-sm">per month</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 p-3 rounded-lg mb-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 glass-button"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 glass-button bg-green-500/30 border-green-400/50 hover:bg-green-500/40"
              >
                {loading ? 'Loading...' : 'Continue to Checkout'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-white/80 text-sm">
                  Get 3 extra timeline generations for a one-time payment
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-400/30">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">$2.99</div>
                  <div className="text-white/80 text-sm">one-time purchase</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 p-3 rounded-lg mb-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 glass-button"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 glass-button bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/40"
              >
                {loading ? 'Loading...' : 'Continue to Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

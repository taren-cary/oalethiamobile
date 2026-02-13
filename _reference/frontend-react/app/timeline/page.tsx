'use client';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import * as Sentry from '@sentry/nextjs';
import HeroSection from '@/components/HeroSection';
import ResultsSection from '@/components/ResultsSection';
import Navigation from '@/components/Navigation';
import WelcomeModal from '@/components/WelcomeModal';
import { useAuth } from '@/contexts/AuthContext';

function TimelineContent() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState('');
  const [context, setContext] = useState('');
  const [timeframe, setTimeframe] = useState(3);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user, session, isFirstTimeUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle success redirects from Stripe payments
  useEffect(() => {
    const success = searchParams.get('success');
    const credits = searchParams.get('credits');
    const portal = searchParams.get('portal');
    
    if (success === 'true') {
      setSuccessMessage('Subscription activated! 🎉 You now have access to Premium features.');
      // Refresh subscription status after a short delay to ensure backend has processed
      setTimeout(() => {
        refreshSubscriptionData();
      }, 1000);
      // Clear query parameter after 5 seconds
      setTimeout(() => {
        router.replace('/timeline');
        setSuccessMessage(null);
      }, 5000);
    } else if (credits === 'true') {
      setSuccessMessage('Credits purchased! ✨ Your credits have been added to your account.');
      // Refresh credits after a short delay to ensure backend has processed
      setTimeout(() => {
        refreshCreditsData();
      }, 1000);
      // Clear query parameter after 5 seconds
      setTimeout(() => {
        router.replace('/timeline');
        setSuccessMessage(null);
      }, 5000);
    } else if (portal === 'returned') {
      // User returned from Stripe Customer Portal - refresh subscription status
      setTimeout(() => {
        refreshSubscriptionData();
      }, 1000);
      // Clear query parameter
      setTimeout(() => {
        router.replace('/timeline');
      }, 2000);
    }
  }, [searchParams, router, user, session]);

  const refreshSubscriptionData = () => {
    if (!user || !session) return;
    // Trigger Navigation component to refresh subscription
    // We'll dispatch a custom event that Navigation can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refresh-subscription'));
    }
  };

  const refreshCreditsData = () => {
    if (!user || !session) return;
    // Trigger HeroSection to refresh credits
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refresh-credits'));
    }
  };

  const handleGenerateTimeline = async (formData: any) => {
    setLoading(true);
    setError('');
    setResults(null);
    setOutcome(formData.outcome);
    setContext(formData.context || '');
    setTimeframe(formData.timeframe || 3);

    try {
      // Use different endpoint based on authentication status
      const endpoint = user 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/generate-timeline`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/generate-timeline-anonymous`;
      
      // Prepare request headers
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header for authenticated users
      if (user && session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await axios.post(endpoint, formData, { headers });
      setResults(response.data);
      
      setTimeout(() => {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Timeline generation error:', err);
      
      // Capture error in Sentry with context
      Sentry.captureException(err, {
        tags: {
          error_type: 'timeline_generation',
          user_type: user ? 'authenticated' : 'anonymous',
        },
        extra: {
          endpoint: user ? '/api/generate-timeline' : '/api/generate-timeline-anonymous',
          outcome: formData.outcome,
          timeframe: formData.timeframe,
        },
      });
      
      // Handle network errors
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
        setError('Request timed out. The server is taking too long to respond. Please try again in a moment.');
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (!err.response) {
        // No response from server
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        const errorMessage = err.response?.data?.error || err.message || 'Something went wrong';
        const statusCode = err.response?.status;
        
        // Handle specific error types
        if (errorMessage.toLowerCase().includes('insufficient credits') || errorMessage.toLowerCase().includes('no credits remaining') || errorMessage.toLowerCase().includes('credits')) {
          setError('You\'ve used all your free credits. Sign up to get 3 free credits per month, or upgrade to Premium for unlimited access!');
        } else if (errorMessage.toLowerCase().includes('credit limit exceeded')) {
          setError('Credit limit exceeded. Please upgrade to Premium for unlimited timeline generations, or purchase additional credits.');
        } else if (errorMessage.toLowerCase().includes('birth') || errorMessage.toLowerCase().includes('birth date') || errorMessage.toLowerCase().includes('location')) {
          setError('There was an issue with your birth information. Please check your birth date and location are correct.');
        } else if (statusCode === 400) {
          setError(`Invalid request: ${errorMessage}. Please check your input and try again.`);
        } else if (statusCode === 401 || statusCode === 403) {
          setError('Your session has expired. Please sign in again and try again.');
        } else if (statusCode === 429) {
          setError('Too many requests. Please wait a moment before trying again.');
        } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
          setError('Server error. Our team has been notified. Please try again in a few moments.');
        } else {
          setError(`Failed to generate timeline: ${errorMessage}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-20">
        {/* Success Message Banner */}
        {successMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4 animate-in slide-in-from-top duration-500">
            <div className="glass-card bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 p-4 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-green-300 text-3xl">✓</div>
                  <p className="text-white font-semibold text-lg">{successMessage}</p>
                </div>
                <button
                  onClick={() => {
                    setSuccessMessage(null);
                    router.replace('/timeline');
                  }}
                  className="text-white/60 hover:text-white text-2xl font-bold"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <HeroSection
          onSubmit={handleGenerateTimeline}
          loading={loading}
          error={error}
          user={user}
        />

        {results && (
          <ResultsSection
            outcome={outcome}
            actions={results.actions}
            timelineAffirmations={results.timelineAffirmations || []}
            tempGenerationId={results.tempGenerationId}
            summary={results.summary}
            user={user}
            context={context}
            timeframe={timeframe}
          />
        )}
      </div>

      {/* Welcome Modal for first-time users */}
      {user && isFirstTimeUser && (
        <WelcomeModal
          isOpen={isFirstTimeUser}
          onClose={() => {}}
        />
      )}
    </main>
  );
}

export default function TimelineGenerator() {
  return (
    <Suspense fallback={
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-20 flex items-center justify-center min-h-screen">
          <div className="glass-card p-8 text-center">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </div>
      </main>
    }>
      <TimelineContent />
    </Suspense>
  );
}

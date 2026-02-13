'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface SavedTimeline {
  id: string;
  outcome: string;
  context: string;
  timeframe: number;
  actions: any[];
  timeline_affirmations: string[];
  summary: any;
  credits_used: number;
  created_at: string;
}

export default function TimelinesPage() {
  const { user, loading: authLoading } = useAuth();
  const [timelines, setTimelines] = useState<SavedTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      fetchTimelines();
    }
  }, [user, authLoading]);

  const fetchTimelines = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('action_timeline_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTimelines(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load timelines');
    } finally {
      setLoading(false);
    }
  };

  const deleteTimeline = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timeline?')) return;

    try {
      const { error } = await supabase
        .from('action_timeline_generations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTimelines(timelines.filter(t => t.id !== id));
    } catch (err: any) {
      alert('Failed to delete timeline');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-32 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="text-white text-xl">Loading your cosmic timelines...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-32 flex items-center justify-center">
          <div className="glass-card p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              Sign in to view your timelines
            </h2>
            <p className="text-white/80 mb-6">
              Create an account or sign in to save and access your cosmic action plans.
            </p>
            <Link href="/" className="glass-button">
              Go to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-32 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold cosmic-text mb-4">
              Your Cosmic Timelines
            </h1>
            <p className="text-xl text-white/80">
              All your saved action plans aligned with the stars
            </p>
          </div>

          {error && (
            <div className="glass-card bg-red-500/20 border-red-400/50 p-4 mb-8">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {timelines.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                No timelines yet
              </h2>
              <p className="text-white/80 mb-6">
                Create your first cosmic action plan to get started!
              </p>
              <Link href="/" className="glass-button text-lg">
                Create Timeline
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timelines.map((timeline) => (
                <div key={timeline.id} className="glass-card p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {timeline.outcome}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {timeline.actions?.length || 0} actions
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTimeline(timeline.id)}
                      className="text-white/40 hover:text-red-400 transition-colors ml-2"
                      title="Delete timeline"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-white/70 text-sm">
                      Created: {formatDate(timeline.created_at)}
                    </p>
                    <p className="text-white/50 text-xs">
                      {timeline.timeframe} month timeline • {timeline.credits_used} credit{timeline.credits_used !== 1 ? 's' : ''} used
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/timeline/${timeline.id}`}
                      className="glass-button flex-1 text-center text-sm"
                    >
                      View Timeline
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/" className="glass-button text-lg">
              Create New Timeline
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

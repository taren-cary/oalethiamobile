'use client';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import CountdownTimer from '@/components/CountdownTimer';
import SubscriptionModal from '@/components/SubscriptionModal';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export default function TimelineViewPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [timeline, setTimeline] = useState<SavedTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedActions, setCompletedActions] = useState<number[]>([]);
  const [skippedActions, setSkippedActions] = useState<number[]>([]);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [affirmationConfirmed, setAffirmationConfirmed] = useState(false);
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set());
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalType, setSubscriptionModalType] = useState<'subscription' | 'credits'>('subscription');
  const params = useParams();

  useEffect(() => {
    if (user && !authLoading && params.id) {
      fetchTimeline();
      loadProgress();
    }
  }, [user, authLoading, params.id]);

  // Load today's affirmation and check status
  useEffect(() => {
    if (user && params.id && timeline) {
      loadTodaysAffirmation();
    }
  }, [user, params.id, timeline]);

  // Fetch user subscription status
  useEffect(() => {
    if (user && session) {
      fetchUserSubscription();
    }
  }, [user, session]);

  const fetchTimeline = async () => {
    if (!user || !params.id) return;

    try {
      const { data, error } = await supabase
        .from('action_timeline_generations')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setTimeline(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = () => {
    if (typeof window === 'undefined') return;
    
    const savedProgress = localStorage.getItem(`eternion_progress_${params.id}`);
    const savedSkipped = localStorage.getItem(`eternion_skipped_${params.id}`);
    const savedAffirmationIndex = localStorage.getItem(`eternion_affirmation_index_${params.id}`);
    const savedAffirmationDate = localStorage.getItem(`eternion_affirmation_date_${params.id}`);
    const confirmedDate = localStorage.getItem(`eternion_affirmation_confirmed_${params.id}`);

    if (savedProgress) {
      setCompletedActions(JSON.parse(savedProgress));
    }
    if (savedSkipped) {
      setSkippedActions(JSON.parse(savedSkipped));
    }
    if (savedAffirmationIndex) {
      setCurrentAffirmationIndex(parseInt(savedAffirmationIndex));
    }
    if (savedAffirmationDate === new Date().toDateString()) {
      setAffirmationConfirmed(confirmedDate === new Date().toDateString());
    }
  };

  const loadTodaysAffirmation = async () => {
    if (!user || !params.id) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/today-affirmation/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentAffirmationIndex(data.affirmation_index);
        setAffirmationConfirmed(data.affirmed);
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Session expired while loading affirmation');
      } else if (response.status === 404) {
        console.warn('Affirmation data not found');
      } else if (response.status === 500) {
        console.error('Server error loading affirmation');
      }
    } catch (error: any) {
      // Only log errors, don't disrupt user experience
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        console.error('Network error loading today\'s affirmation:', error);
      } else {
        console.error('Error loading today\'s affirmation:', error);
      }
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-subscription`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data);
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Unauthorized: Session may have expired');
        setUserSubscription({ tier: { name: 'free' }, isFree: true, status: 'active' });
      } else if (response.status === 500) {
        console.error('Server error fetching subscription. Using default free tier.');
        setUserSubscription({ tier: { name: 'free' }, isFree: true, status: 'active' });
      }
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        setUserSubscription({ tier: { name: 'free' }, isFree: true, status: 'active' });
      }
    }
  };

  const toggleAction = (index: number) => {
    const newCompleted = completedActions.includes(index)
      ? completedActions.filter(i => i !== index)
      : [...completedActions, index];
    
    setCompletedActions(newCompleted);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`eternion_progress_${params.id}`, JSON.stringify(newCompleted));
    }
  };

  const skipAction = (index: number) => {
    const newSkipped = [...skippedActions, index];
    setSkippedActions(newSkipped);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`eternion_skipped_${params.id}`, JSON.stringify(newSkipped));
    }
  };

  const toggleActionExpansion = (index: number) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedActions(newExpanded);
  };

  const confirmAffirmation = async () => {
    setAffirmationConfirmed(true);
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString();
      localStorage.setItem(`eternion_affirmation_confirmed_${params.id}`, today);
    }

    // Record affirmation in database if user is authenticated
    if (user) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/affirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            generation_id: params.id,
            affirmation_index: currentAffirmationIndex,
            affirmation_text: timeline?.timeline_affirmations[currentAffirmationIndex]
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.points_awarded > 0) {
            // Show points earned notification
            showPointsNotification(data.points_awarded);
            // Trigger points refresh in Navigation
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('refresh-points'));
            }
          }
          
          // Check for level up
          if (data.levelUp && data.levelUp.newLevel) {
            // Trigger level-up modal
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('level-up', {
                detail: {
                  newLevel: data.levelUp.newLevel,
                  levelName: data.levelUp.levelName,
                  previousLevel: data.levelUp.previousLevel
                }
              }));
            }
          }
          
          // If already affirmed, don't change the button state
          if (data.already_affirmed) {
            return;
          }
        } else if (response.status === 401 || response.status === 403) {
          console.warn('Session expired while recording affirmation');
        } else if (response.status === 500) {
          console.error('Server error recording affirmation. Points may not have been awarded.');
        }
      } catch (error: any) {
        // Only log errors, don't disrupt user experience for background operations
        if (error.message?.includes('fetch') || error.name === 'TypeError') {
          console.error('Network error recording affirmation:', error);
        } else {
          console.error('Error recording affirmation:', error);
        }
        // Capture in Sentry for monitoring
        Sentry.captureException(error, {
          tags: {
            error_type: 'affirmation_recording',
          },
        });
      }
    }
  };

  const showPointsNotification = (points: number) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Create points notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9))';
    notification.style.color = 'white';
    notification.style.padding = '16px 24px';
    notification.style.borderRadius = '12px';
    notification.style.fontWeight = 'bold';
    notification.style.fontSize = '16px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    notification.style.backdropFilter = 'blur(10px)';
    notification.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    notification.textContent = `+${points} points earned!`;
    
    document.body.appendChild(notification);
    
    // Animate notification
    notification.animate([
      { transform: 'translateX(100%)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 },
      { transform: 'translateX(0)', opacity: 1 },
      { transform: 'translateX(100%)', opacity: 0 }
    ], {
      duration: 3000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    };
  };

  const parseActionDate = (dateString: string) => {
    try {
      let date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        if (dateString.toLowerCase().includes('next')) {
          date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        } else if (dateString.toLowerCase().includes('tomorrow')) {
          date = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else {
          const cleanedDate = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
          date = new Date(cleanedDate);
        }
      }
      
      date.setHours(23, 59, 59, 999);
      return date;
    } catch (error) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-32 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="text-white text-xl">Loading your cosmic timeline...</div>
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
              Sign in to view this timeline
            </h2>
            <Link href="/" className="glass-button">
              Go to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (error || !timeline) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-32 flex items-center justify-center">
          <div className="glass-card p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              Timeline not found
            </h2>
            <p className="text-white/80 mb-6">
              {error || 'This timeline may have been deleted or you may not have access to it.'}
            </p>
            <Link href="/timelines" className="glass-button">
              Back to Timelines
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Filter out skipped actions
  const visibleActions = timeline.actions.filter((_, index) => !skippedActions.includes(index));
  
  // Find the next incomplete action
  const nextActionIndex = visibleActions.findIndex((_, index) => 
    !completedActions.includes(timeline.actions.indexOf(visibleActions[index]))
  );
  
  const nextAction = nextActionIndex >= 0 ? visibleActions[nextActionIndex] : null;
  const nextActionOriginalIndex = nextAction ? timeline.actions.indexOf(nextAction) : -1;

  const progress = visibleActions.length > 0 ? Math.round((completedActions.length / visibleActions.length) * 100) : 0;

  // Determine if user can see all actions
  const canSeeAllActions = userSubscription?.tier?.can_see_all_actions || false;
  const isAnonymous = !user;
  const isFreeUser = user && (userSubscription?.isFree === true || userSubscription?.tier?.name === 'free');

  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-20 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 mb-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              🌟 Your Cosmic Action Plan 🌟
            </h2>
            <p className="text-3xl font-bold cosmic-text mb-4">
              {timeline.outcome}
            </p>
            <div className="inline-block glass-button text-lg">
              Timeline: {timeline.summary?.actionsGenerated} actions
            </div>
          </div>

          <div className="glass-card p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Your Progress</h3>
            <div className="bg-white/10 rounded-full h-8 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-purple-400 to-pink-400 h-full flex items-center justify-center text-white font-bold transition-all duration-500"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
            <p className="text-white/80">
              {completedActions.length} of {visibleActions.length} actions completed
              {skippedActions.length > 0 && (
                <span className="text-white/60 ml-2">
                  ({skippedActions.length} skipped)
                </span>
              )}
            </p>
          </div>

          {/* Next Action Card - Prominent */}
          {nextAction && (
            <div className="next-action-card mb-8">
              <div className="glass-card p-8 border-2 border-yellow-400/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={completedActions.includes(nextActionOriginalIndex)}
                      onChange={() => toggleAction(nextActionOriginalIndex)}
                      className="mt-1 w-8 h-8 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="inline-block bg-yellow-500/40 text-white px-4 py-2 rounded-full text-sm font-bold">
                          🎯 NEXT ACTION
                        </div>
                        <div className="inline-block bg-purple-500/30 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {nextAction.date}
                        </div>
                        <div className="inline-block">
                          <CountdownTimer 
                            targetDate={parseActionDate(nextAction.date)}
                            compact={true}
                          />
                        </div>
                      </div>
                      {/* Transit at the top */}
                      <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4 mb-4">
                        <p className="text-blue-200 font-semibold text-sm mb-1">
                          Your Cosmic Support:
                        </p>
                        <p className="text-white text-lg">
                          {nextAction.transit}
                        </p>
                      </div>

                      {/* Action inside blue card with expand functionality */}
                      <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white text-2xl font-bold">
                            {nextAction.action}
                          </h3>
                          <button
                            onClick={() => toggleActionExpansion(nextActionOriginalIndex)}
                            className="text-blue-300 hover:text-blue-100 transition-colors p-1"
                            title={expandedActions.has(nextActionOriginalIndex) ? "Collapse" : "Expand"}
                          >
                            <svg
                              className={`w-6 h-6 transition-transform duration-200 ${expandedActions.has(nextActionOriginalIndex) ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Expanded content */}
                        {expandedActions.has(nextActionOriginalIndex) && (
                          <div className="space-y-4">
                            {/* Strategy */}
                            {(nextAction.strategy || nextAction.strategies) && (
                              <div>
                                <h4 className="text-blue-200 font-semibold text-sm mb-2">Strategy:</h4>
                                <div className="text-white/90 text-sm leading-relaxed">
                                  {nextAction.strategy || (nextAction.strategies && nextAction.strategies.map((strategy: string, idx: number) => (
                                    <p key={idx} className="mb-2">{strategy}</p>
                                  )))}
                                </div>
                              </div>
                            )}

                            {/* YouTube Videos */}
                            {nextAction.youtubeVideos && nextAction.youtubeVideos.length > 0 && (
                              <div>
                                <h4 className="text-blue-200 font-semibold text-sm mb-3">Video Resources:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {nextAction.youtubeVideos.map((video: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block group"
                                    >
                                      <div className="relative overflow-hidden rounded-lg">
                                        <img
                                          src={video.thumbnail}
                                          alt={video.title}
                                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                          onError={(e) => {
                                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMzUgNzVMMTY1IDkwTDEzNSAxMDVWNzVaIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iMTAwIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjEyIj5WaWRlbzwvdGV4dD4KPC9zdmc+';
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      </div>
                                      <p className="text-white/80 text-xs mt-1 line-clamp-2 group-hover:text-white transition-colors">
                                        {video.title}
                                      </p>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Articles */}
                            {nextAction.articles && nextAction.articles.length > 0 && (
                              <div>
                                <h4 className="text-blue-200 font-semibold text-sm mb-3">Article Resources:</h4>
                                <div className="space-y-2">
                                  {nextAction.articles.map((article: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4 text-blue-300 group-hover:text-blue-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-white/80 text-sm group-hover:text-white transition-colors line-clamp-1">
                                          {article.title}
                                        </span>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Daily Affirmation as floating quote bubble */}
                      {timeline.timeline_affirmations && timeline.timeline_affirmations.length > 0 && (
                        <div className="relative">
                          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 mb-4 shadow-lg">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="text-purple-300 text-2xl">✨</div>
                                <p className="text-purple-200 font-semibold text-sm">
                                  TODAY'S COSMIC AFFIRMATION
                                </p>
                                <div className="text-purple-300 text-2xl">✨</div>
                              </div>
                              <p className="text-purple-300 text-xs mb-3">
                                {new Date().toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-white text-lg font-medium mb-4 affirmation-text italic">
                                "{timeline.timeline_affirmations[currentAffirmationIndex]}"
                              </p>
                              <p className="text-purple-200 text-xs affirmation-hashtags mb-4">
                                #CosmicManifestation #MarsEnergy #CareerGoals
                              </p>
                              <div className="flex flex-col items-center">
                                <button 
                                  onClick={() => !affirmationConfirmed && confirmAffirmation()}
                                  className={`affirmation-confirm-btn ${affirmationConfirmed ? 'confirmed' : ''}`}
                                  disabled={affirmationConfirmed}
                                >
                                  <span className="affirmation-checkbox">
                                    {affirmationConfirmed ? '✓' : '○'}
                                  </span>
                                  <span className="affirmation-confirm-text">
                                    {affirmationConfirmed ? 'Affirmed' : 'Affirm'}
                                  </span>
                                </button>
                                {affirmationConfirmed && (
                                  <p className="affirmation-tomorrow-text">
                                    ✨ Check back tomorrow for your next affirmation
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Quote bubble tail */}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-500/20"></div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                  <button
                    onClick={() => skipAction(nextActionOriginalIndex)}
                    className="skip-button text-white/60 hover:text-white/90 transition-colors text-sm"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remaining Actions */}
          <div className="space-y-4">
            {visibleActions.map((action, index) => {
              const originalIndex = timeline.actions.indexOf(action);
              const isNextAction = originalIndex === nextActionOriginalIndex;
              
              if (isNextAction) return null; // Skip the next action as it's shown above
              
              const isExpanded = expandedActions.has(originalIndex);
              const shouldBlur = !canSeeAllActions && !isNextAction && (isFreeUser || isAnonymous);
              
              return (
                <div
                  key={originalIndex}
                  className={`glass-card p-6 transition-all duration-300 relative ${
                    completedActions.includes(originalIndex) ? 'opacity-60 bg-white/5' : 'hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={completedActions.includes(originalIndex)}
                      onChange={() => toggleAction(originalIndex)}
                      className="mt-1 w-6 h-6 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      {/* Date and Transit at the top */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="inline-block bg-purple-500/30 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {action.date}
                        </div>
                        <div className="flex-1 bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
                          <p className="text-blue-200 font-semibold text-xs mb-1">
                            Your Cosmic Support:
                          </p>
                          <p className="text-white/80 text-sm">
                            {action.transit}
                          </p>
                        </div>
                      </div>

                      {/* Action inside blue card with expand functionality */}
                      <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white text-lg font-medium">
                            {action.action}
                          </h3>
                          <button
                            onClick={() => toggleActionExpansion(originalIndex)}
                            className="text-blue-300 hover:text-blue-100 transition-colors p-1"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            <svg
                              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="space-y-4">
                            {/* Strategy */}
                            {(action.strategy || action.strategies) && (
                              <div>
                                <h4 className="text-blue-200 font-semibold text-sm mb-2">Strategy:</h4>
                                <div className="text-white/90 text-sm leading-relaxed">
                                  {action.strategy || (action.strategies && action.strategies.map((strategy: string, idx: number) => (
                                    <p key={idx} className="mb-2">{strategy}</p>
                                  )))}
                                </div>
                              </div>
                            )}

                            {/* YouTube Videos */}
                            {action.youtubeVideos && action.youtubeVideos.length > 0 && (
                              <div>
                                <h4 className="text-blue-200 font-semibold text-sm mb-3">Video Resources:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {action.youtubeVideos.map((video: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block group"
                                    >
                                      <div className="relative overflow-hidden rounded-lg">
                                        <img
                                          src={video.thumbnail}
                                          alt={video.title}
                                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                          onError={(e) => {
                                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMzUgNzVMMTY1IDkwTDEzNSAxMDVWNzVaIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iMTAwIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjEyIj5WaWRlbzwvdGV4dD4KPC9zdmc+';
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      </div>
                                      <p className="text-white/80 text-xs mt-1 line-clamp-2 group-hover:text-white transition-colors">
                                        {video.title}
                                      </p>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Articles */}
                            {action.articles && action.articles.length > 0 && (
                              <div>
                                <h4 className="text-blue-200 font-semibold text-sm mb-3">Article Resources:</h4>
                                <div className="space-y-2">
                                  {action.articles.map((article: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4 text-blue-300 group-hover:text-blue-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-white/80 text-sm group-hover:text-white transition-colors line-clamp-1">
                                          {article.title}
                                        </span>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Daily Affirmation - only show on the next action (first incomplete action) */}
                      {index === 0 && !completedActions.includes(index) && timeline.timeline_affirmations && timeline.timeline_affirmations.length > 0 && (
                        <div className="relative">
                          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-4 mb-4 shadow-lg">
                            <div className="flex items-start gap-3">
                              <div className="text-purple-300 text-2xl">✨</div>
                              <div>
                                <p className="text-purple-200 font-semibold text-xs mb-1">Daily Affirmation</p>
                                <p className="text-white/90 text-sm italic leading-relaxed">
                                  "{timeline.timeline_affirmations[currentAffirmationIndex]}"
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Quote bubble tail */}
                          <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-500/20"></div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => skipAction(originalIndex)}
                      className="skip-button text-white/40 hover:text-white/70 transition-colors text-sm"
                    >
                      Skip
                    </button>
                  </div>
                  
                  {/* Blur overlay for restricted actions */}
                  {shouldBlur && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-lg z-10">
                      <div className="text-center p-6">
                        <div className="text-4xl mb-3">🔒</div>
                        <p className="text-white font-semibold mb-2">Premium Feature</p>
                        <p className="text-white/80 text-sm mb-4">
                          {isFreeUser ? 'Upgrade to Premium to see all actions' : 'Sign up to see all actions'}
                        </p>
                        <div className="flex gap-2 justify-center">
                          {isFreeUser ? (
                            <>
                              <button
                                onClick={() => {
                                  setSubscriptionModalType('subscription');
                                  setShowSubscriptionModal(true);
                                }}
                                className="glass-button bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40 text-sm py-2 px-4"
                              >
                                Upgrade to Premium
                              </button>
                              <button
                                onClick={() => {
                                  setSubscriptionModalType('credits');
                                  setShowSubscriptionModal(true);
                                }}
                                className="glass-button bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/40 text-sm py-2 px-4"
                              >
                                Buy Credits
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                // Handle sign up - redirect to home
                                window.location.href = '/';
                              }}
                              className="glass-button bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40 text-sm py-2 px-4"
                            >
                              Sign Up
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/timelines" className="glass-button text-lg">
              Back to All Timelines
            </Link>
          </div>
        </div>
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        type={subscriptionModalType}
      />
    </main>
  );
}

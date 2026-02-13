'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DragSubmitSlider from './DragSubmitSlider';
import CosmicLoadingSpinner from './CosmicLoadingSpinner';
import SubscriptionModal from './SubscriptionModal';
import { supabase } from '@/lib/supabase';
import { AnonymousCreditsManager } from '@/lib/anonymousCredits';

interface HeroSectionProps {
  onSubmit: (data: any) => void;
  loading: boolean;
  error: string;
  user?: any;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function HeroSection({ onSubmit, loading, error, user }: HeroSectionProps) {
  const [outcome, setOutcome] = useState('');
  const [context, setContext] = useState('');
  const [availableResources, setAvailableResources] = useState('');
  const [preferredApproach, setPreferredApproach] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [timeframe, setTimeframe] = useState(3);
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [locationError, setLocationError] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [anonymousCredits, setAnonymousCredits] = useState<number>(0);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [formError, setFormError] = useState('');
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalType, setSubscriptionModalType] = useState<'subscription' | 'credits'>('subscription');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load user profile data if user is logged in, or check anonymous credits
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserCredits();
      loadUserSubscription();
    } else {
      checkAnonymousCredits();
    }
  }, [user]);

  // Refresh credits when loading stops (timeline generation completed)
  useEffect(() => {
    if (!loading && user) {
      loadUserCredits();
    }
  }, [loading, user]);

  // Listen for refresh events from payment success
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRefreshCredits = () => {
      if (user) {
        loadUserCredits();
        loadUserSubscription(); // Also refresh subscription as credits purchase might affect it
      }
    };

    window.addEventListener('refresh-credits', handleRefreshCredits);
    return () => {
      window.removeEventListener('refresh-credits', handleRefreshCredits);
    };
  }, [user]);

  // Clean up search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const checkAnonymousCredits = async () => {
    try {
      const anonymousData = AnonymousCreditsManager.getAnonymousUserData();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-anonymous-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anonymousData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnonymousCredits(data.credits_remaining);
      }
    } catch (error) {
      console.error('Error checking anonymous credits:', error);
      // Fallback to local storage
      setAnonymousCredits(AnonymousCreditsManager.getRemainingCredits());
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('birth_charts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setUserProfile(data);
        
        // Format birth date properly for input field
        if (data.birth_date) {
          const date = new Date(data.birth_date);
          const formattedDate = date.toISOString().split('T')[0];
          setBirthDate(formattedDate);
        }
        
        // Format birth time properly for input field
        if (data.birth_time) {
          setBirthTime(data.birth_time);
        }
        
        setLocation(data.location || '');
        setCoordinates({ 
          lat: data.latitude?.toString() || '', 
          lng: data.longitude?.toString() || '' 
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  const loadUserSubscription = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-subscription`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data);
      }
    } catch (error) {
      console.error('Error loading user subscription:', error);
    }
  };

  const fillTestData = () => {
    setOutcome('Hit $10,000 per month in revenue');
    setContext('I\'m a freelance graphic designer with 2 regular clients, making $3k/month, working from home, have 5 years experience but want to scale up');
    setAvailableResources('I have 3-4 hours per day available, budget of $200-300 for tools/courses, small professional network of about 20 contacts');
    setPreferredApproach('balanced');
    setBirthDate('1990-06-15');
    setBirthTime('14:30');
    setLocation('New York, NY, USA');
    setCoordinates({ lat: '40.7128', lng: '-74.0060' });
    setTimeframe(6);
  };

  // Search for location suggestions
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/geocode?query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocationError('Location search temporarily unavailable. Please try again.');
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setLocationError('');
    setSelectedLocation(null);
    setCoordinates({ lat: '', lng: '' });
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.length >= 3) {
      // Debounce: wait 300ms after user stops typing before searching
      const timeout = setTimeout(() => {
        searchLocations(value);
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.display_name);
    setCoordinates({ lat: suggestion.lat, lng: suggestion.lon });
    setSelectedLocation(suggestion);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setLocationError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Clear any existing errors
    setFormError('');
    setLocationError('');
    
    // Form validation
    if (!outcome.trim()) {
      setFormError('Please describe what you want to achieve. This helps us create a personalized timeline for you.');
      return;
    }
    
    if (!birthDate) {
      setFormError('Birth date is required for accurate astrological calculations. Your birth chart is essential for creating your cosmic timeline.');
      return;
    }
    
    if (!location.trim()) {
      setFormError('Birth location is required for precise astrological calculations. Please enter your birth city and country.');
      return;
    }
    
    // If location is provided but coordinates aren't set, try to geocode
    if (location && (!coordinates.lat || !coordinates.lng)) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          setCoordinates({ lat: data[0].lat, lng: data[0].lon });
        } else {
          setLocationError('Please select a valid location from the suggestions above. This ensures accurate astrological calculations.');
          return;
        }
      } catch (error) {
        setLocationError('Please select a valid location from the suggestions above. This ensures accurate astrological calculations.');
        return;
      }
    }

    // Default to 12:00 PM if no birth time is provided
    const finalBirthTime = birthTime || '12:00';

    const formData: any = {
      outcome,
      context,
      availableResources,
      preferredApproach,
      timeframe,
      birthDate,
      birthTime: finalBirthTime,
      latitude: parseFloat(coordinates.lat),
      longitude: parseFloat(coordinates.lng),
    };

    // Add anonymous user ID if not authenticated
    if (!user) {
      formData.anonymous_user_id = AnonymousCreditsManager.getAnonymousUserId();
    }

    onSubmit(formData);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-suggestions')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold mb-4 cosmic-text drop-shadow-2xl">
            Oalethia StarManifest™
          </h1>
          <p className="text-2xl text-white/90 drop-shadow-lg">
            Manifestation Isn't Wishing, It's Navigation!
          </p>
        </div>

        <div className="glass-card p-8 md:p-12">
          {/* User Onboarding */}
          <div className="glass-card bg-blue-500/20 border-blue-400/50 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-blue-300 text-3xl">✨</div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Outmaneuver The Odds With Perfect Intention & Perfect Timing</h3>
                <p className="text-white/80 text-sm mb-3">
                  At each moment, your mind is in a certain psychic state or configuration i.e. you as a CEO, you as a millionaire, you as a parent etc. These states come with an arrow of time connecting the way you interpret the past, your feelings in the present moment, and your expectations of the future. When you intentionally choose to be in a certain state, you are changing the trajectory of your future or steering it in another direction. Based on your birth chart and your current goals, there are times when these states are easier for you to reach. Our AI analyzes your birth chart and creates a step-by-step timeline of actions and affirmations timed to optimal cosmic moments, to help you navigate your reality and manifest your goals.{' '}
                  <Link href="/quantum-astrology" className="text-blue-300 hover:text-blue-200 underline font-medium">
                    Learn More
                  </Link>
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-blue-500/30 text-blue-200 px-2 py-1 rounded">🎯 Personalized Actions</span>
                  <span className="bg-blue-500/30 text-blue-200 px-2 py-1 rounded">⭐ Astrological Timing</span>
                  <span className="bg-blue-500/30 text-blue-200 px-2 py-1 rounded">📅 Daily Affirmations</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                What do you want to achieve? <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="glass-input w-full text-lg"
                placeholder="e.g., Get promoted, Find a partner, Hit $10k/month"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                What's your current situation with this goal?
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="glass-input w-full min-h-[100px]"
                placeholder="Be specific! For example: 'I'm a freelance graphic designer with 2 regular clients, making $3k/month, working from home, have 5 years experience but want to scale up'"
              />
              <p className="text-white/70 text-sm mt-1">
                💡 The more specific you are, the more personalized your action plan will be
              </p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                What resources do you have available?
              </label>
              <input
                type="text"
                value={availableResources}
                onChange={(e) => setAvailableResources(e.target.value)}
                className="glass-input w-full"
                placeholder="e.g., 'I have 3-4 hours per day available, budget of $200-300 for tools/courses, small professional network of about 20 contacts'"
              />
              <p className="text-white/70 text-sm mt-1">
                💡 Include time, budget, network, skills, or any other resources you can use
              </p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                What's your preferred approach?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'conservative', label: 'Conservative', desc: 'Steady, low-risk steps' },
                  { value: 'balanced', label: 'Balanced', desc: 'Mix of steady and bold moves' },
                  { value: 'aggressive', label: 'Aggressive', desc: 'Bold, high-impact actions' }
                ].map(approach => (
                  <button
                    key={approach.value}
                    type="button"
                    onClick={() => setPreferredApproach(approach.value as 'conservative' | 'balanced' | 'aggressive')}
                    className={`p-3 rounded-xl text-center transition-all ${
                      preferredApproach === approach.value
                        ? 'bg-white/30 border-2 border-white/60 text-white scale-105'
                        : 'bg-white/10 border border-white/30 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <div className="font-semibold text-white">{approach.label}</div>
                    <div className="text-xs text-white/70">{approach.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-3">
                Timeframe to achieve this goal:
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[1, 3, 6, 12].map((months) => {
                  const maxTimeframe = userSubscription?.tier?.max_timeframe || 3;
                  const isRestricted = months > maxTimeframe;
                  const isAnonymous = !user;
                  const isPremium = userSubscription?.tier?.name === 'premium';
                  
                  return (
                    <button
                      key={months}
                      type="button"
                      onClick={() => !isRestricted && setTimeframe(months)}
                      disabled={isRestricted}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 relative ${
                        timeframe === months
                          ? 'bg-white/30 border-2 border-white/60 text-white scale-105'
                          : isRestricted
                          ? 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'
                          : 'bg-white/10 border border-white/30 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {months === 1 ? '1 Month' : months === 12 ? '1 Year' : `${months} Months`}
                      {isRestricted && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            🔒
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {(!user || userSubscription?.tier?.name === 'free') && (
                <p className="text-white/60 text-sm mt-2">
                  💡 Premium users can access 6-12 month timelines
                </p>
              )}
            </div>

            {/* Birth Information Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Birth Information</h3>
                {userProfile && (
                  <div className="text-green-400 text-sm font-medium">
                    ✓ Loaded from your profile
                  </div>
                )}
              </div>
              
              {/* Birth Date and Time - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Birth Date <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="glass-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Birth Time <span className="text-white/70 text-sm">(optional - defaults to 12:00 PM)</span>
                  </label>
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Leave blank for 12:00 PM"
                  />
                </div>
              </div>

              {/* Location Input with Autocomplete - Full Width */}
              <div className="relative">
                <label className="block text-white font-semibold mb-2">Birth Location <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Start typing a city, country, or address..."
                  required
                  autoComplete="off"
                />
                
                {/* Location Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="location-suggestions absolute z-50 w-full mt-1 bg-black/80 backdrop-blur-md border border-white/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-white/30 transition-colors border-b border-white/20 last:border-b-0 text-white"
                      >
                        <div className="text-white text-sm font-medium">
                          {suggestion.display_name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {locationError && (
                  <p className="text-red-400 text-sm mt-1">{locationError}</p>
                )}
                {coordinates.lat && coordinates.lng && (
                  <p className="text-green-400 text-sm mt-1">
                    ✓ Location found: {coordinates.lat}, {coordinates.lng}
                  </p>
                )}
              </div>
              
            </div>

            {(error || formError) && (
              <div className="glass-card bg-red-500/20 border-red-400/50 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-red-400 text-2xl">⚠️</div>
                  <div className="flex-1">
                    <p className="text-red-200 font-semibold mb-1">Something went wrong</p>
                    <p className="text-red-200/80 text-sm mb-3">{error || formError}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.reload();
                          }
                        }}
                        className="glass-button bg-red-500/20 border-red-400/50 hover:bg-red-500/30 text-red-200 text-sm px-4 py-2"
                      >
                        🔄 Try Again
                      </button>
                      <button 
                        onClick={() => {
                          setFormError('');
                          // Note: We can't clear the prop error, but we can clear form errors
                        }}
                        className="glass-button text-sm px-4 py-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="glass-card p-8 text-center">
                <CosmicLoadingSpinner size="large" />
                <div className="mt-6">
                  <h3 className="text-white font-semibold text-lg mb-2">Generating Your Manifestation Timeline</h3>
                  <p className="text-white/80 text-sm mb-4">
                    We're analyzing your birth chart and creating personalized actions aligned with quantum mechanics...
                  </p>
                  <div className="bg-white/10 rounded-full h-2 overflow-hidden mb-4">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-full w-3/4 animate-pulse"></div>
                  </div>
                  <p className="text-white/60 text-xs">
                    This usually takes 30-60 seconds ⏱️
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {(!coordinates.lat || !coordinates.lng) && (
                  <div className="glass-card bg-yellow-500/20 border-yellow-400/50 p-4 mb-4">
                    <p className="text-white font-semibold">
                      ⚠️ Please select a location from the suggestions above to enable submission
                    </p>
                  </div>
                )}
                <DragSubmitSlider
                  onSubmit={handleSubmit}
                  loading={loading}
                  disabled={!coordinates.lat || !coordinates.lng}
                />
                
                {/* Credits Display */}
                {user ? (
                  <div className="glass-card bg-purple-500/20 border-purple-400/50 p-4 mt-4">
                    <div className="text-center">
                      <p className="text-white font-semibold mb-2">
                        💫 Your Cosmic Credits
                      </p>
                      <p className="text-white/80 text-sm">
                        {userCredits} credit{userCredits !== 1 ? 's' : ''} remaining
                      </p>
                      {(userSubscription?.isFree === true || userSubscription?.tier?.name === 'free') && (
                        <>
                          <p className="text-white/60 text-xs mt-1">
                            Free plan: 3 credits/month
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                setSubscriptionModalType('subscription');
                                setShowSubscriptionModal(true);
                              }}
                              className="flex-1 glass-button bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40 text-sm py-2"
                            >
                              Upgrade to Premium
                            </button>
                            <button
                              onClick={() => {
                                setSubscriptionModalType('credits');
                                setShowSubscriptionModal(true);
                              }}
                              className="flex-1 glass-button bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/40 text-sm py-2"
                            >
                              Buy Credits
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card bg-purple-500/20 border-purple-400/50 p-6 mt-4">
                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-3">🌟 Why Sign Up?</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <span className="text-green-400">✓</span>
                          <span>3 credits per month</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <span className="text-green-400">✓</span>
                          <span>Save unlimited timelines</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <span className="text-green-400">✓</span>
                          <span>Track your progress</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <span className="text-green-400">✓</span>
                          <span>Daily cosmic affirmations</span>
                        </div>
                      </div>
                      <p className="text-white/60 text-xs">
                        Anonymous users: {anonymousCredits}/1 credit this month
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        
        {/* Trust Signals */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm mb-2">
            ✨ Powered by Swiss Ephemeris & OpenAI ✨
          </p>
          <p className="text-white/50 text-xs">
            Professional-grade astrological calculations • AI-powered personalization
          </p>
        </div>
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        type={subscriptionModalType}
      />
    </section>
  );
}

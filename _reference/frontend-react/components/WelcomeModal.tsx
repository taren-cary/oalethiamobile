'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import WelcomeBadgeModal from './WelcomeBadgeModal';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [locationError, setLocationError] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showWelcomeBadge, setShowWelcomeBadge] = useState(false);
  const { user, setFirstTimeUser } = useAuth();

  if (!isOpen || !user) return null;

  // Clean up search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setLocationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
            setLocationError('Please select a valid location from the suggestions');
            setLoading(false);
            return;
          }
        } catch (error) {
          setLocationError('Please select a valid location from the suggestions');
          setLoading(false);
          return;
        }
      }

      // Default to 12:00 PM if no birth time is provided
      const finalBirthTime = birthTime || '12:00';

      // Save birth chart to Supabase
      const { error: profileError } = await supabase
        .from('birth_charts')
        .upsert({
          user_id: user.id,
          birth_date: birthDate,
          birth_time: finalBirthTime,
          location: location,
          latitude: parseFloat(coordinates.lat),
          longitude: parseFloat(coordinates.lng),
          planets: {}, // Will be populated by backend
          houses: {}, // Will be populated by backend
          ascendant: 0, // Will be calculated by backend
          mc: 0, // Will be calculated by backend
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        throw profileError;
      }

      setFirstTimeUser(false);
      // Show welcome badge modal instead of closing immediately
      setShowWelcomeBadge(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save birth information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative glass-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold cosmic-text mb-2">
            🌟 Welcome to Your Cosmic Journey! 🌟
          </h2>
          <p className="text-white/80 text-lg">
            To create personalized action timelines aligned with the stars, we need your birth information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Birth Date *
              </label>
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

          <div className="relative">
            <label className="block text-white font-semibold mb-2">Birth Location *</label>
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

          {error && (
            <div className="glass-card bg-red-500/20 border-red-400/50 p-4">
              <p className="text-white font-semibold">❌ {error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !coordinates.lat || !coordinates.lng}
              className="glass-button flex-1 text-lg py-3"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            This information is used to calculate your personalized astrological transits and create cosmic action plans.
          </p>
        </div>
      </div>

      {/* Welcome Badge Modal */}
      <WelcomeBadgeModal
        isOpen={showWelcomeBadge}
        onClose={() => {
          setShowWelcomeBadge(false);
          onClose();
        }}
      />
    </div>
  );
}

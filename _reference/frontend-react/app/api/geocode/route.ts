import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// In-memory cache for geocoding results (24 hour TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting: track last request time per IP
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 500; // Allow 2 requests per second (more lenient for typing)

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

/**
 * Rate limiting helper - allows 2 requests per second per IP
 * This is more lenient than OpenStreetMap's 1 req/sec, but caching helps
 * and we want good UX for typing
 */
function checkRateLimit(ip: string): boolean {
  const lastRequest = rateLimitMap.get(ip) || 0;
  const now = Date.now();
  
  if (now - lastRequest < RATE_LIMIT_MS) {
    return false; // Rate limited
  }
  
  rateLimitMap.set(ip, now);
  return true; // Allowed
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

/**
 * Search using OpenStreetMap Nominatim
 */
async function searchOpenStreetMap(query: string): Promise<any[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'EternionApp/1.0 (https://eternion.app)',
        'Accept-Language': 'en'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`OpenStreetMap API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.map((item: any) => ({
    display_name: item.display_name,
    lat: item.lat,
    lon: item.lon
  }));
}

/**
 * Search using Google Places API (fallback only)
 */
async function searchGooglePlaces(query: string, apiKey: string): Promise<any[]> {
  try {
    // Autocomplete request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      // Silently fail - don't expose Google Places API errors
      throw new Error(`Places API error: ${data.status}`);
    }
    
    if (data.status === 'ZERO_RESULTS') {
      return [];
    }
    
    // Get place details for each suggestion
    const suggestions = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction: any) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${apiKey}`
          );
          const details = await detailsResponse.json();
          
          return {
            display_name: prediction.description,
            lat: details.result.geometry.location.lat.toString(),
            lon: details.result.geometry.location.lng.toString()
          };
        } catch (error) {
          console.error('Error getting place details:', error);
          return null;
        }
      })
    );
    
    return suggestions.filter(suggestion => suggestion !== null);
  } catch (error) {
    // Silently fail - don't expose Google Places API errors to users
    console.error('Google Places API fallback failed');
    throw error; // Re-throw to be caught by outer handler
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const query = searchParams.get('query');
    
    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }
    
    // Normalize query for caching (lowercase, trim)
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check cache first
    const cached = cache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }
    
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before searching again.' },
        { status: 429 }
      );
    }
    
    let suggestions: any[] = [];
    
    // Try OpenStreetMap first (primary, free)
    try {
      suggestions = await searchOpenStreetMap(query);
      
      // Cache successful results
      if (suggestions.length > 0) {
        cache.set(normalizedQuery, {
          data: suggestions,
          timestamp: Date.now()
        });
      }
    } catch (osmError) {
      console.error('OpenStreetMap error:', osmError);
      
      // Fallback to Google Places API if configured
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (googleApiKey) {
        try {
          suggestions = await searchGooglePlaces(query, googleApiKey);
          
          // Cache successful results
          if (suggestions.length > 0) {
            cache.set(normalizedQuery, {
              data: suggestions,
              timestamp: Date.now()
            });
          }
        } catch (googleError) {
          // Silently handle Google Places fallback failure
          // Don't log or expose the error - just continue with empty results
          console.error('Google Places fallback unavailable');
        }
      }
      
      // If OpenStreetMap failed and no Google API key, log to Sentry
      if (!googleApiKey) {
        Sentry.captureException(osmError, {
          tags: {
            error_type: 'geocoding_openstreetmap',
          },
          extra: {
            query: query,
          },
        });
      }
    }
    
    return NextResponse.json(suggestions);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    Sentry.captureException(error, {
      tags: {
        error_type: 'geocoding',
      },
      extra: {
        query: searchParams.get('query'),
      },
    });
    return NextResponse.json({ error: 'Location search failed' }, { status: 500 });
  }
}

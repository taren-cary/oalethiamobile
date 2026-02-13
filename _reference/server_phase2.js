const express = require('express');
const sweph = require('sweph');
const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables first
dotenv.config();

// Initialize Stripe after environment variables are loaded
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Database tables already exist - no initialization needed

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Middleware
app.use(cors({
  origin: [
    'https://oalethia.com',
    'https://oalethia.netlify.app',
    'http://localhost:3001',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.static(__dirname));

// Set ephemeris path
const ephemerisPath = path.join(__dirname, 'ephemeris');
sweph.set_ephe_path(ephemerisPath);

// Planet constants (sweph uses numerical IDs)
const PLANETS = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9
};

const PLANET_NAMES = Object.keys(PLANETS);

// Aspect orbs
const ASPECTS = {
  conjunction: { angle: 0, orb: 8 },
  sextile: { angle: 60, orb: 6 },
  square: { angle: 90, orb: 8 },
  trine: { angle: 120, orb: 8 }
};

// Points system configuration
const POINTS_SYSTEM = {
  action_completed: 10,
  timeline_finished: 50,
  daily_login: 5,
  streak_7_days: 25,
  streak_30_days: 100,
  referral: 50,
  feedback: 15,
  social_share: 10,
  first_generation: 25,
  milestone_10_actions: 30,
  milestone_50_actions: 100,
  milestone_100_actions: 250
};

// Achievement levels configuration
const ACHIEVEMENT_LEVELS = [
  { level: 1, name: "Initiate of the Compass", points: 0 },
  { level: 2, name: "Orbital Apprentice", points: 25 },
  { level: 3, name: "Bearer of Intent", points: 75 },
  { level: 4, name: "Awakened Navigator", points: 200 },
  { level: 5, name: "Celestial Adept", points: 500 },
  { level: 6, name: "Stellar Alchemist", points: 1200 },
  { level: 7, name: "Master of Arrival", points: 2500 },
  { level: 8, name: "Sage of the Void", points: 5000 },
  { level: 9, name: "Solar Oracle", points: 10000 },
  { level: 10, name: "Quantum Starseed", points: 20000 },
  { level: 11, name: "Cosmic Admiral", points: 40000 },
  { level: 12, name: "Eternal Sovereign", points: 75000 }
];

// Helper function to calculate user level from lifetime points
function calculateLevel(lifetimePoints) {
  // Start from highest level and work down
  for (let i = ACHIEVEMENT_LEVELS.length - 1; i >= 0; i--) {
    if (lifetimePoints >= ACHIEVEMENT_LEVELS[i].points) {
      return ACHIEVEMENT_LEVELS[i];
    }
  }
  // Fallback to level 1
  return ACHIEVEMENT_LEVELS[0];
}

// Helper function to check and update user level
async function checkAndUpdateLevel(userId, lifetimePoints) {
  try {
    const currentLevelData = calculateLevel(lifetimePoints);
    
    // Get current level from database
    const { data: userPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('current_level')
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user level:', fetchError);
      return { leveledUp: false };
    }
    
    const currentLevel = userPoints?.current_level || 1;
    
    // If user leveled up
    if (currentLevelData.level > currentLevel) {
      // Update user_points table
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          current_level: currentLevelData.level,
          level_achieved_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating user level:', updateError);
        return { leveledUp: false };
      }
      
      // Record achievement (use upsert to handle duplicates gracefully)
      const { error: achievementError } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          level: currentLevelData.level,
          achieved_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,level'
        });
      
      if (achievementError) {
        console.error('Error recording achievement:', achievementError);
        // Don't fail the whole operation if achievement recording fails
      }
      
      return {
        leveledUp: true,
        newLevel: currentLevelData.level,
        levelName: currentLevelData.name,
        previousLevel: currentLevel
      };
    }
    
    return { leveledUp: false };
  } catch (error) {
    console.error('Error in checkAndUpdateLevel:', error);
    return { leveledUp: false };
  }
}

// ==============================================
// RATE LIMITING MIDDLEWARE
// ==============================================

// Rate limiter for timeline generation (10 requests per minute per user)
const timelineGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many timeline generation requests. Please wait a moment before trying again.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Key generator: use user ID for authenticated requests, IP for anonymous
  keyGenerator: (req) => {
    // If user is authenticated (after requireAuth middleware), use user ID
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    // Otherwise use IP address
    return getClientIP(req) || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting if it's a health check or similar
    return false;
  }
});

// Rate limiter for anonymous credit checks (30 requests per minute per IP)
const anonymousCreditsCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Too many credit check requests. Please wait a moment before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key generator: use IP address
  keyGenerator: (req) => {
    return getClientIP(req) || req.ip;
  }
});

// ==============================================
// AUTHENTICATION MIDDLEWARE
// ==============================================

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Calculate Julian Day from date and time
 */
function dateToJulianDay(year, month, day, hour, minute) {
  const decimalTime = hour + minute / 60.0;
  return sweph.julday(year, month, day, decimalTime, 1);
}

/**
 * Calculate natal chart with planets and houses
 */
function calculateNatalChart(birthDate, birthTime, latitude, longitude) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  
  const julianDay = dateToJulianDay(year, month, day, hour, minute);
  
  const planets = {};
  
  // Calculate positions for all 10 planets
  for (const [planetName, planetId] of Object.entries(PLANETS)) {
    const result = sweph.calc_ut(julianDay, planetId, 2);
    
    if (result.error) {
      throw new Error(`Error calculating ${planetName}: ${result.error}`);
    }
    
    planets[planetName] = {
      longitude: result.data[0],
      latitude: result.data[1],
      speed: result.data[3]
    };
  }
  
  // Calculate houses using Placidus system
  const houses = sweph.houses(julianDay, latitude, longitude, 'P');
  
  return {
    planets,
    houses: houses.data.house,
    ascendant: houses.data.ascendant,
    mc: houses.data.mc,
    julianDay
  };
}

/**
 * Calculate angle between two longitudes (0-180 degrees)
 */
function calculateAngle(long1, long2) {
  let diff = Math.abs(long1 - long2);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

/**
 * Check if two longitudes form an aspect
 */
function checkAspect(transitLongitude, natalLongitude) {
  const angle = calculateAngle(transitLongitude, natalLongitude);
  
  for (const [aspectName, aspectData] of Object.entries(ASPECTS)) {
    if (Math.abs(angle - aspectData.angle) <= aspectData.orb) {
      return {
        type: aspectName,
        orb: Math.abs(angle - aspectData.angle)
      };
    }
  }
  
  return null;
}

/**
 * Calculate transit aspects for a given timeframe
 */
function calculateTransitAspects(natalChart, startDate, days = 364) {
  const allAspects = [];
  const [year, month, day] = startDate.split('-').map(Number);
  
  // Starting Julian Day
  const startJD = dateToJulianDay(year, month, day, 0, 0);
  
  // Loop through each day
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentJD = startJD + dayOffset;
    
    // Calculate date for this Julian Day
    const dateInfo = sweph.revjul(currentJD, 1);  // 1 = Gregorian calendar
    const dateStr = `${dateInfo.year}-${String(dateInfo.month).padStart(2, '0')}-${String(dateInfo.day).padStart(2, '0')}`;
    
    // Calculate transit positions for all planets
    for (const [transitPlanetName, transitPlanetId] of Object.entries(PLANETS)) {
      const transitResult = sweph.calc_ut(currentJD, transitPlanetId, 2);  // 2 = SEFLG_SWIEPH
      
      if (transitResult.error) continue;
      
      const transitLongitude = transitResult.data[0];  // longitude from data array
      
      // Check aspects to natal planets
      for (const [natalPlanetName, natalData] of Object.entries(natalChart.planets)) {
        const aspect = checkAspect(transitLongitude, natalData.longitude);
        
        if (aspect) {
          allAspects.push({
            date: dateStr,
            transitPlanet: transitPlanetName,
            natalPlanet: natalPlanetName,
            aspectType: aspect.type,
            orb: aspect.orb.toFixed(2),
            description: `Transit ${transitPlanetName} ${aspect.type} Natal ${natalPlanetName}`
          });
        }
      }
      
      // Check aspects to Ascendant
      const ascAspect = checkAspect(transitLongitude, natalChart.ascendant);
      if (ascAspect) {
        allAspects.push({
          date: dateStr,
          transitPlanet: transitPlanetName,
          natalPlanet: 'ASCENDANT',
          aspectType: ascAspect.type,
          orb: ascAspect.orb.toFixed(2),
          description: `Transit ${transitPlanetName} ${ascAspect.type} Natal ASCENDANT`
        });
      }
    }
  }
  
  return allAspects;
}

/**
 * Select most significant transits spread across the timeline
 */
function selectSignificantTransits(allTransits, count) {
  if (allTransits.length === 0) return [];
  
  // Sort by date
  const sorted = [...allTransits].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Divide timeline into segments
  const segmentSize = Math.floor(sorted.length / count);
  const selected = [];
  
  for (let i = 0; i < count && i * segmentSize < sorted.length; i++) {
    const segment = sorted.slice(i * segmentSize, (i + 1) * segmentSize);
    if (segment.length > 0) {
      // Pick transit with tightest orb from this segment
      const best = segment.reduce((prev, curr) => 
        parseFloat(curr.orb) < parseFloat(prev.orb) ? curr : prev
      );
      selected.push(best);
    }
  }
  
  return selected;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}


/**
 * Generate action timeline using OpenAI
 */
async function generateActionTimeline(outcome, context, availableResources, preferredApproach, timeframeMonths, keyTransits) {
  const transitsList = keyTransits.map(t => 
    `${formatDate(t.date)}: ${t.description}`
  ).join('\n');
  
  const timeframeText = timeframeMonths === 1 ? '1 month' : `${timeframeMonths} months`;
  
  const prompt = `You are an expert astrologer and life coach creating an ACTION-BASED timeline. Write strategies in natural, flowing text without including any URLs, links, or web addresses.

USER'S GOAL: "${outcome}"
USER'S CURRENT SITUATION: "${context}"
AVAILABLE RESOURCES: "${availableResources}"
PREFERRED APPROACH: ${preferredApproach}
TIMEFRAME: ${timeframeText}

KEY TRANSITS IN THIS PERIOD:
${transitsList}

TASK: Create a specific action plan of 8-12 actionable steps aligned to these transits. Each action MUST include a detailed 2-3 paragraph strategy. Use web search to find current information, best practices, and resources to make the actions more specific and actionable.

CRITICAL RULES:
1. Each action MUST be tied to a specific transit date
2. Actions should be CONCRETE and DOABLE (not vague like "be confident")
3. Use the transit energy to suggest WHEN to do each action
4. Mix different types of actions:
   - Communication/outreach actions
   - Skill-building/learning actions  
   - Strategic planning actions
   - Relationship/networking actions
   - Execution/implementation actions
5. Make actions SPECIFIC to their goal (use details from their CURRENT SITUATION)
6. Actions should build on each other toward the outcome
7. NEVER invent details not provided (no names, specific industries, etc.)
8. Keep actions realistic - what they can actually control and do
9. Use their AVAILABLE RESOURCES to ensure actions are feasible (time, budget, network, skills)
10. Match their PREFERRED APPROACH:
    - Conservative: Steady, low-risk, methodical steps
    - Balanced: Mix of steady progress and calculated risks
    - Aggressive: Bold, high-impact, fast-paced actions
11. For each action, provide a detailed 2-3 paragraph strategy that explains HOW to complete it
12. Strategies should be comprehensive, actionable, and leverage the transit energy
13. Use web search to find current best practices, tools, and resources for each action
14. Make actions specific with current information, trends, and available tools
15. For each action, provide 1 daily affirmation that supports completing that specific action
16. Affirmations should be empowering, action-oriented, and 1-2 sentences long
17. Affirmations should focus on personal strength and confidence, avoiding astrological terms

WEB SEARCH GUIDANCE:
- Use web search to find current best practices and tools for each action
- Look up recent trends, technologies, and methods relevant to the user's goal
- Find specific tools, apps, or services that can help complete actions
- Search for current industry information, market trends, or opportunities
- Look up recent success stories or case studies in the user's field
- Find current pricing, requirements, or standards for relevant actions
- Search for networking opportunities, events, or communities
- Use current information to make actions more specific and actionable
- IMPORTANT: Do NOT include URLs, links, or web addresses in your strategy text
- Write strategies in natural, flowing text without any web links or citations
- Reference tools and resources by name only, not by including their URLs

TRANSIT GUIDANCE:
- Jupiter transits = expand, take risks, learn, grow
- Saturn transits = structure, commit, discipline, plan
- Mars transits = act, initiate, push forward, compete
- Venus transits = connect, attract, beautify, harmonize
- Mercury transits = communicate, write, strategize, learn
- Uranus transits = innovate, pivot, try something new
- Neptune transits = envision, create, trust intuition
- Pluto transits = transform deeply, let go, rebuild
- Moon transits = check in emotionally, nurture, reflect
- Sun transits = shine, lead, take center stage

OUTPUT FORMAT (valid JSON array):
[
  {
    "date": "January 15, 2026",
    "action": "Specific action they should take",
    "transit": "Transit description explaining the cosmic timing",
    "strategy": "Detailed 2-3 paragraph strategy explaining how to complete this action. This should be comprehensive and actionable, leveraging the transit energy for maximum effectiveness. The strategy should break down the action into clear steps and provide specific guidance on implementation.",
    "affirmation": "I am confident and capable of completing this action successfully"
  }
]

EXAMPLE (for "hit $10k/month" goal):
[
  {
    "date": "November 5, 2025",
    "action": "Reach out to 5 past clients to let them know you're taking on new projects",
    "transit": "Transit Mercury conjunct Natal Venus - perfect for reconnecting",
    "strategy": "This action leverages Mercury's communication energy to reconnect with past clients. Start by creating a personalized message template that highlights your recent successes and current offerings. Research each client's current business needs and challenges before reaching out to make your message relevant and valuable. Set a specific time block to send all 5 messages within 2 hours to maintain momentum and capitalize on Mercury's communication boost.",
    "affirmation": "I communicate with confidence and attract positive responses from my network"
  }
]

CRITICAL REQUIREMENTS: 
- Every action object MUST include the "strategy" field with a detailed 2-3 paragraph explanation
- Every action object MUST include the "affirmation" field with exactly 1 daily affirmation
- All strings must be on single lines with no line breaks
- Output ONLY valid JSON array with no additional text or markdown

Generate ${Math.min(12, Math.max(8, Math.floor(timeframeMonths * 2)))} actions as valid JSON array:`;

  const response = await openai.responses.create({
    model: 'gpt-4o',
    input: [
      {
        role: 'system',
        content: 'You are an expert astrologer and strategic life coach. You create specific, actionable timelines that align real-world actions with astrological transits. You understand planetary energies and how to leverage them for goal achievement. You MUST include a detailed 2-3 paragraph strategy and 1 affirmation for each action. You output ONLY valid JSON arrays with no additional text or markdown. All strings must be properly escaped and contain no line breaks.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    tools: [
      { type: "web_search" }
    ]
  });
  
  // Handle response with potential web search results
  try {
    // Responses API uses output_text instead of choices[0].message.content
    let content = response.output_text;
    
    // Debug: Log the raw response
    console.log('Raw AI Response:', content);
    
    // Check if web search was used (content will include search results automatically)
    if (content && content.includes('[') && content.includes(']')) {
      console.log('Web search results may be included in response');
    }
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Fix common JSON issues - remove line breaks within strings
    content = content.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');
    content = content.replace(/"([^"]*)\r\n([^"]*)"/g, '"$1 $2"');
    
    // Fix line breaks in the middle of strings (more aggressive)
    content = content.replace(/"([^"]*)\n\s*([^"]*)"/g, '"$1 $2"');
    content = content.replace(/"([^"]*)\r\n\s*([^"]*)"/g, '"$1 $2"');
    
    // Handle incomplete strings at the end
    const lines = content.split('\n');
    let cleanContent = '';
    let inString = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let cleanLine = line;
      
      // Count braces to track object completion
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // If we're in a string and the line doesn't end with a quote, join with next line
      if (inString && !line.includes('"')) {
        cleanContent += ' ' + line.trim();
        continue;
      }
      
      // Check if we're entering or exiting a string
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        inString = !inString;
      }
      
      cleanContent += line + '\n';
    }
    
    // Final cleanup
    cleanContent = cleanContent.trim();
    
    // Try to parse the cleaned content
    const parsed = JSON.parse(cleanContent);
    
    // Validate the structure
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    // Validate each action has required fields
    for (const action of parsed) {
      if (!action.date || !action.action || !action.transit || !action.affirmation) {
        throw new Error('Action missing required fields');
      }
      // Check for either new strategy field or old strategies array (backward compatibility)
      if (!action.strategy && !action.strategies) {
        throw new Error('Action missing strategy or strategies field');
      }
      // YouTube videos and articles are optional for now
      if (action.youtubeVideos && !Array.isArray(action.youtubeVideos)) {
        throw new Error('YouTube videos must be an array');
      }
      if (action.articles && !Array.isArray(action.articles)) {
        throw new Error('Articles must be an array');
      }
    }
    
    console.log(`Generated ${parsed.length} actions successfully`);
    return parsed;
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    console.error('Raw AI Response:', response.output_text);
    throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
  }
}

/**
 * Generate timeline affirmations
 */
async function generateTimelineAffirmations(totalDays, outcome, context, transits) {
  const prompt = `Generate ${totalDays} daily affirmations for a ${Math.ceil(totalDays/30)}-month timeline to achieve: "${outcome}"

Context: ${context}

Each affirmation should:
1. Be 1-2 sentences long
2. Be empowering and action-oriented
3. Focus on personal strength, confidence, and manifestation
4. Support the overall goal of: ${outcome}
5. Be unique and not repetitive
6. Avoid mentioning planets, astrology, or cosmic terms
7. Use universal language about energy, success, and achievement

OUTPUT FORMAT: Return ONLY a JSON array of strings, no other text:
[
  "I am confident and capable of achieving my goal of ${outcome}",
  "Every day I take powerful steps toward manifesting ${outcome}",
  "I attract success and opportunities that align with my vision of ${outcome}"
]

Generate exactly ${totalDays} affirmations as a valid JSON array:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert manifestation coach and personal development specialist. You create powerful daily affirmations that focus on personal empowerment, confidence, and goal achievement. You avoid astrological or cosmic language and use universal, empowering language instead. You output ONLY valid JSON arrays with no additional text or markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  try {
    let content = response.choices[0].message.content;
    
    // Clean up the response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Fix common JSON issues
    content = content.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');
    content = content.replace(/"([^"]*)\r\n([^"]*)"/g, '"$1 $2"');
    
    const parsed = JSON.parse(content);
    
    // Validate it's an array
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    // Ensure we have the right number of affirmations
    if (parsed.length !== totalDays) {
      console.warn(`Expected ${totalDays} affirmations, got ${parsed.length}`);
    }
    
    return parsed;
  } catch (parseError) {
    console.error('JSON Parse Error for affirmations:', parseError);
    console.error('Raw AI Response:', response.output_text);
    
    // Fallback affirmations
    const fallbackAffirmations = [
      'I am confident and capable of achieving my goal of ' + outcome,
      'Every day I take powerful steps toward manifesting ' + outcome,
      'I trust the process and take inspired action',
      'My intentions are clear and my actions are powerful',
      'I am worthy of achieving my highest aspirations',
      'I attract success and opportunities that align with my vision',
      'I am aligned with my purpose and ready to succeed',
      'I have the strength and determination to reach my goals',
      'I am grateful for the progress I make each day',
      'I believe in my ability to create the life I desire'
    ];
    
    // Repeat fallback affirmations to reach totalDays
    const result = [];
    for (let i = 0; i < totalDays; i++) {
      result.push(fallbackAffirmations[i % fallbackAffirmations.length]);
    }
    return result;
  }
}

// ==============================================
// CREDITS SYSTEM ENDPOINTS
// ==============================================

app.get('/api/credits', requireAuth, async (req, res) => {
  try {
    const { data: credits, error } = await supabase
      .from('user_credits')
      .select('credits, last_reset_date')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!credits) {
      // Create new user credits record
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: req.user.id,
          credits: 3,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return res.json(newCredits);
    }

    // Check if credits need to be reset (new month)
    const lastReset = new Date(credits.last_reset_date);
    const now = new Date();
    
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      // Reset credits
      const { data: updatedCredits, error: updateError } = await supabase
        .from('user_credits')
        .update({
          credits: 3,
          last_reset_date: now.toISOString().split('T')[0]
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log the reset
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: req.user.id,
          amount: 3,
          type: 'bonus',
          source: 'monthly_reset'
        });

      return res.json(updatedCredits);
    }

    res.json(credits);
  } catch (error) {
    console.error('Credits error:', error);
    res.status(500).json({ error: 'Failed to get credits' });
  }
});

app.post('/api/credits/use', requireAuth, async (req, res) => {
  try {
    const { amount = 1 } = req.body;

    // Get current credits
    const { data: credits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', req.user.id)
      .single();

    if (fetchError) throw fetchError;

    if (!credits || credits.credits < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credits
    const { data: updatedCredits, error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: credits.credits - amount })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: req.user.id,
        amount: -amount,
        type: 'used',
        source: 'generation'
      });

    res.json({ success: true, remainingCredits: updatedCredits.credits });
  } catch (error) {
    console.error('Use credits error:', error);
    res.status(500).json({ error: 'Failed to use credits' });
  }
});

// ==============================================
// POINTS SYSTEM ENDPOINTS
// ==============================================

app.get('/api/points', requireAuth, async (req, res) => {
  try {
    const { data: points, error } = await supabase
      .from('user_points')
      .select('total_points, lifetime_points')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!points) {
      // Create new user points record
      const { data: newPoints, error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: req.user.id,
          total_points: 0,
          lifetime_points: 0
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return res.json(newPoints);
    }

    res.json(points);
  } catch (error) {
    console.error('Points error:', error);
    res.status(500).json({ error: 'Failed to get points' });
  }
});

app.post('/api/points/earn', requireAuth, async (req, res) => {
  try {
    const { points, source, description } = req.body;

    if (!points || !source) {
      return res.status(400).json({ error: 'Points and source are required' });
    }

    // Insert points transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: req.user.id,
        points: points,
        type: 'earned',
        source: source,
        description: description
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update user's total points
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points, lifetime_points')
      .eq('user_id', req.user.id)
      .single();

    if (pointsError && pointsError.code !== 'PGRST116') {
      throw pointsError;
    }

    if (!userPoints) {
      // Create new user points record
      const { data: newPoints, error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: req.user.id,
          total_points: points,
          lifetime_points: points
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return res.json({ success: true, newTotal: newPoints.total_points });
    }

    // Update existing points
    const { data: updatedPoints, error: updateError } = await supabase
      .from('user_points')
      .update({
        total_points: userPoints.total_points + points,
        lifetime_points: userPoints.lifetime_points + points
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, newTotal: updatedPoints.total_points });
  } catch (error) {
    console.error('Earn points error:', error);
    res.status(500).json({ error: 'Failed to award points' });
  }
});

// ==============================================
// BIRTH CHART ENDPOINTS
// ==============================================

app.get('/api/birth-chart', requireAuth, async (req, res) => {
  try {
    const { data: birthChart, error } = await supabase
      .from('birth_charts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!birthChart) {
      return res.status(404).json({ error: 'No birth chart found' });
    }

    res.json(birthChart);
  } catch (error) {
    console.error('Get birth chart error:', error);
    res.status(500).json({ error: 'Failed to get birth chart' });
  }
});

app.post('/api/birth-chart', requireAuth, async (req, res) => {
  try {
    const { birthDate, birthTime, latitude, longitude, location } = req.body;

    if (!birthDate || !birthTime || latitude === undefined || longitude === undefined || !location) {
      return res.status(400).json({ error: 'All birth chart fields are required' });
    }

    // Calculate natal chart
    const natalChart = calculateNatalChart(birthDate, birthTime, latitude, longitude);

    // Check if birth chart already exists
    const { data: existingChart, error: checkError } = await supabase
      .from('birth_charts')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let result;
    if (existingChart) {
      // Update existing chart
      const { data: updatedChart, error: updateError } = await supabase
        .from('birth_charts')
        .update({
          birth_date: birthDate,
          birth_time: birthTime,
          latitude: latitude,
          longitude: longitude,
          location: location,
          planets: natalChart.planets,
          houses: natalChart.houses,
          ascendant: natalChart.ascendant,
          mc: natalChart.mc
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updatedChart;
    } else {
      // Insert new chart
      const { data: newChart, error: insertError } = await supabase
        .from('birth_charts')
        .insert({
          user_id: req.user.id,
          birth_date: birthDate,
          birth_time: birthTime,
          latitude: latitude,
          longitude: longitude,
          location: location,
          planets: natalChart.planets,
          houses: natalChart.houses,
          ascendant: natalChart.ascendant,
          mc: natalChart.mc
        })
        .select()
        .single();

      if (insertError) throw insertError;
      result = newChart;
    }

    res.json({ success: true, message: 'Birth chart saved', data: result });
  } catch (error) {
    console.error('Save birth chart error:', error);
    res.status(500).json({ error: 'Failed to save birth chart' });
  }
});

// ==============================================
// ANONYMOUS CREDITS ENDPOINTS
// ==============================================

// API endpoint to check anonymous credits
app.post('/api/check-anonymous-credits', anonymousCreditsCheckLimiter, async (req, res) => {
  try {
    const { anonymous_user_id, user_agent, screen_resolution, timezone } = req.body;
    const ip_address = getClientIP(req);
    
    const { data, error } = await supabase.rpc('get_anonymous_credits', {
      p_anonymous_user_id: anonymous_user_id,
      p_ip_address: ip_address,
      p_user_agent: user_agent,
      p_screen_resolution: screen_resolution,
      p_timezone: timezone
    });
    
    if (error) {
      console.error('Error checking anonymous credits:', error);
      return res.status(500).json({ error: 'Failed to check credits' });
    }
    
    res.json({ 
      credits_remaining: data[0]?.credits_remaining || 0,
      credits_used: data[0]?.credits_used || 0
    });
  } catch (error) {
    console.error('Error in check-anonymous-credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to use anonymous credit
app.post('/api/use-anonymous-credit', async (req, res) => {
  try {
    const { anonymous_user_id } = req.body;
    const ip_address = getClientIP(req);
    
    const { data, error } = await supabase.rpc('use_anonymous_credit', {
      p_anonymous_user_id: anonymous_user_id,
      p_ip_address: ip_address
    });
    
    if (error) {
      console.error('Error using anonymous credit:', error);
      return res.status(500).json({ error: 'Failed to use credit' });
    }
    
    res.json({ success: data });
  } catch (error) {
    console.error('Error in use-anonymous-credit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to generate timeline for anonymous users
app.post('/api/generate-timeline-anonymous', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      outcome, 
      context, 
      availableResources,
      preferredApproach,
      timeframe, 
      birthDate, 
      birthTime, 
      latitude, 
      longitude,
      anonymous_user_id 
    } = req.body;

    // Validate input
    if (!outcome || !timeframe || !birthDate || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if anonymous user has credits
    const ip_address = getClientIP(req);
    const { data: creditData, error: creditError } = await supabase.rpc('use_anonymous_credit', {
      p_anonymous_user_id: anonymous_user_id,
      p_ip_address: ip_address
    });

    if (creditError) {
      console.error('Error checking anonymous credits:', creditError);
      return res.status(500).json({ error: 'Failed to check credits' });
    }

    if (!creditData) {
      return res.status(400).json({ 
        error: 'No credits remaining. Sign up to get 3 free credits per month!' 
      });
    }

    // Default to 12:00 PM if no birth time provided
    const finalBirthTime = birthTime || '12:00';
    
    console.log(`Generating action timeline for anonymous user ${anonymous_user_id}: ${outcome}`);
    console.log(`Timeframe: ${timeframe} months`);
    
    // Calculate natal chart
    console.log('Calculating natal chart...');
    const natalChart = calculateNatalChart(birthDate, finalBirthTime, latitude, longitude);
    
    // Calculate transits for the specified timeframe
    const days = Math.floor(timeframe * 30.5);
    console.log(`Calculating transits for ${days} days starting from today...`);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const allTransits = calculateTransitAspects(natalChart, todayStr, days);
    
    console.log(`Found ${allTransits.length} total transits`);
    
    // Select most significant transits
    const numTransits = Math.min(15, Math.max(8, Math.floor(timeframe * 3)));
    const significantTransits = selectSignificantTransits(allTransits, numTransits);
    
    console.log(`Selected ${significantTransits.length} significant transits`);
    
    // Generate action timeline
    console.log('Generating action plan...');
    const actions = await generateActionTimeline(
      outcome, 
      context || "No additional context provided", 
      availableResources || "No specific resources mentioned",
      preferredApproach || "balanced",
      timeframe, 
      significantTransits
    );
    
    // Generate timeline affirmations
    console.log('Generating timeline affirmations...');
    const totalDays = timeframe * 30;
    const timelineAffirmations = await generateTimelineAffirmations(totalDays, outcome, context, significantTransits);
    
    const calculationTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`Complete! Generated ${actions.length} actions and ${timelineAffirmations.length} affirmations in ${calculationTime} seconds`);

    // Return the timeline data (same format as authenticated endpoint)
    res.json({
      actions,
      timelineAffirmations,
      summary: {
        actionsGenerated: actions.length,
        calculationTime: calculationTime,
        timeframe: timeframe,
        transitsUsed: significantTransits.length
      }
    });
  } catch (error) {
    console.error('Anonymous timeline generation error:', error);
    res.status(500).json({ error: 'Failed to generate timeline' });
  }
});

// API endpoint to record daily affirmation confirmation and award points
app.post('/api/affirm', requireAuth, async (req, res) => {
  try {
    const { generation_id, affirmation_index, affirmation_text } = req.body;
    
    if (!generation_id || affirmation_index === undefined) {
      return res.status(400).json({ error: 'Generation ID and affirmation index are required' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Handle temporary generation IDs (unsaved timelines)
    if (generation_id.startsWith('temp_')) {
      // For unsaved timelines, just award points without database tracking
      const pointsAwarded = 5;
      const levelUpResult = await awardPoints(req.user.id, pointsAwarded, 'daily_affirmation', `temp_${today}`);
      
      return res.json({ 
        success: true, 
        message: 'Daily affirmation recorded! (Timeline not saved yet)',
        points_awarded: pointsAwarded,
        already_affirmed: false,
        levelUp: levelUpResult?.leveledUp ? {
          newLevel: levelUpResult.newLevel,
          levelName: levelUpResult.levelName,
          previousLevel: levelUpResult.previousLevel
        } : null
      });
    }

    // Check if user already affirmed today's affirmation for this timeline
    const { data: existingAffirmation, error: checkError } = await supabase
      .from('daily_affirmations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('timeline_id', generation_id)
      .eq('date', today)
      .single();

    if (existingAffirmation && !checkError) {
      if (existingAffirmation.affirmed) {
        return res.json({ 
          success: true, 
          message: 'Already affirmed today\'s affirmation!',
          points_awarded: 0,
          already_affirmed: true
        });
      } else {
        // Update existing record to mark as affirmed
        const pointsAwarded = 5; // 5 points per daily affirmation
        
        const { error: updateError } = await supabase
          .from('daily_affirmations')
          .update({
            affirmed: true,
            affirmed_at: new Date().toISOString(),
            points_awarded: pointsAwarded,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAffirmation.id);

        if (updateError) {
          console.error('Error updating daily affirmation:', updateError);
          return res.status(500).json({ error: 'Failed to record affirmation' });
        }

        // Award points
        const levelUpResult = await awardPoints(req.user.id, pointsAwarded, 'daily_affirmation', `${generation_id}_${today}`);

        return res.json({ 
          success: true, 
          message: 'Daily affirmation recorded!',
          points_awarded: pointsAwarded,
          already_affirmed: false,
          levelUp: levelUpResult?.leveledUp ? {
            newLevel: levelUpResult.newLevel,
            levelName: levelUpResult.levelName,
            previousLevel: levelUpResult.previousLevel
          } : null
        });
      }
    }

    // Create new daily affirmation record
    const pointsAwarded = 5; // 5 points per daily affirmation
    
    const { data: newAffirmation, error: insertError } = await supabase
      .from('daily_affirmations')
      .insert({
        user_id: req.user.id,
        timeline_id: generation_id,
        affirmation_index: affirmation_index,
        affirmation_text: affirmation_text,
        date: today,
        affirmed: true,
        affirmed_at: new Date().toISOString(),
        points_awarded: pointsAwarded
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating daily affirmation:', insertError);
      return res.status(500).json({ error: 'Failed to record affirmation' });
    }

    // Award points
    const levelUpResult = await awardPoints(req.user.id, pointsAwarded, 'daily_affirmation', `${generation_id}_${today}`);

    res.json({ 
      success: true, 
      message: 'Daily affirmation recorded!',
      points_awarded: pointsAwarded,
      already_affirmed: false,
      levelUp: levelUpResult?.leveledUp ? {
        newLevel: levelUpResult.newLevel,
        levelName: levelUpResult.levelName,
        previousLevel: levelUpResult.previousLevel
      } : null
    });

  } catch (error) {
    console.error('Error recording affirmation:', error);
    res.status(500).json({ error: 'Failed to record affirmation' });
  }
});

// Helper function to award points and check for level ups
// Returns: { leveledUp: boolean, newLevel?: number, levelName?: string, previousLevel?: number } or null on error
async function awardPoints(userId, points, source, description) {
  try {
    // Create points transaction
    const { error: pointsError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        points: points,
        type: 'earned',
        source: source,
        description: description
      });

    if (pointsError) {
      console.error('Error creating points transaction:', pointsError);
      return null;
    }

    // Update user's total points
    let updatedLifetimePoints = 0;
    try {
      // First try to use the SQL function
      const { error: updateError } = await supabase.rpc('increment_user_points', {
        p_user_id: userId,
        p_points_to_add: points
      });

      if (updateError) {
        console.log('SQL function not available, using manual update:', updateError.message);
        
        // Fallback: Manual update if SQL function doesn't exist
        const { data: existingPoints, error: fetchError } = await supabase
          .from('user_points')
          .select('total_points, lifetime_points')
          .eq('user_id', userId)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // User doesn't exist in user_points table, create new record
          const { error: insertError } = await supabase
            .from('user_points')
            .insert({
              user_id: userId,
              total_points: points,
              lifetime_points: points,
              current_level: 1 // Initialize with level 1
            });

          if (insertError) {
            console.error('Error creating user points record:', insertError);
            return null;
          }
          updatedLifetimePoints = points;
        } else if (!fetchError) {
          // User exists, update their points
          updatedLifetimePoints = (existingPoints.lifetime_points || 0) + points;
          const { error: updateError2 } = await supabase
            .from('user_points')
            .update({
              total_points: (existingPoints.total_points || 0) + points,
              lifetime_points: updatedLifetimePoints,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (updateError2) {
            console.error('Error updating user points manually:', updateError2);
            return null;
          }
        }
      } else {
        // SQL function succeeded, fetch updated points to check for level up
        const { data: updatedPoints, error: fetchError } = await supabase
          .from('user_points')
          .select('lifetime_points')
          .eq('user_id', userId)
          .single();
        
        if (!fetchError && updatedPoints) {
          updatedLifetimePoints = updatedPoints.lifetime_points || 0;
        }
      }

      // Check for level up after points are updated
      if (updatedLifetimePoints > 0) {
        const levelUpResult = await checkAndUpdateLevel(userId, updatedLifetimePoints);
        return levelUpResult;
      }

      return { leveledUp: false };
    } catch (error) {
      console.error('Error in points update process:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in points award process:', error);
    return null;
  }
}

// API endpoint to get today's affirmation for a timeline
app.get('/api/today-affirmation/:generationId', requireAuth, async (req, res) => {
  try {
    const { generationId } = req.params;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // First, get the timeline to access the affirmations array
    const { data: timeline, error: timelineError } = await supabase
      .from('action_timeline_generations')
      .select('timeline_affirmations')
      .eq('id', generationId)
      .eq('user_id', req.user.id)
      .single();

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError);
      return res.status(404).json({ error: 'Timeline not found' });
    }

    // Check if we already have today's affirmation in the database
    const { data: existingAffirmation, error: checkError } = await supabase
      .from('daily_affirmations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('timeline_id', generationId)
      .eq('date', today)
      .single();

    if (existingAffirmation && !checkError) {
      // Return existing affirmation
      return res.json({
        affirmation_index: existingAffirmation.affirmation_index,
        affirmation_text: existingAffirmation.affirmation_text,
        affirmed: existingAffirmation.affirmed,
        date: existingAffirmation.date
      });
    }

    // Calculate today's affirmation index based on days since timeline creation
    const { data: timelineData, error: timelineDataError } = await supabase
      .from('action_timeline_generations')
      .select('created_at')
      .eq('id', generationId)
      .single();

    if (timelineDataError) {
      console.error('Error fetching timeline data:', timelineDataError);
      return res.status(500).json({ error: 'Failed to fetch timeline data' });
    }

    const timelineCreatedDate = new Date(timelineData.created_at);
    const daysSinceCreation = Math.floor((new Date() - timelineCreatedDate) / (1000 * 60 * 60 * 24));
    const affirmationIndex = daysSinceCreation % timeline.timeline_affirmations.length;
    const affirmationText = timeline.timeline_affirmations[affirmationIndex];

    // Create new daily affirmation record (not affirmed yet)
    const { data: newAffirmation, error: insertError } = await supabase
      .from('daily_affirmations')
      .insert({
        user_id: req.user.id,
        timeline_id: generationId,
        affirmation_index: affirmationIndex,
        affirmation_text: affirmationText,
        date: today,
        affirmed: false,
        points_awarded: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating daily affirmation:', insertError);
      return res.status(500).json({ error: 'Failed to create daily affirmation' });
    }

    res.json({
      affirmation_index: affirmationIndex,
      affirmation_text: affirmationText,
      affirmed: false,
      date: today
    });

  } catch (error) {
    console.error('Get today affirmation error:', error);
    res.status(500).json({ error: 'Failed to get today\'s affirmation' });
  }
});

// API endpoint to check if user has already affirmed today's affirmation for a timeline
app.get('/api/check-affirmation/:generationId', requireAuth, async (req, res) => {
  try {
    const { generationId } = req.params;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: existingAffirmation, error } = await supabase
      .from('daily_affirmations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('timeline_id', generationId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking affirmation:', error);
      return res.status(500).json({ error: 'Failed to check affirmation status' });
    }

    res.json({ 
      already_affirmed: existingAffirmation ? existingAffirmation.affirmed : false,
      affirmation_index: existingAffirmation ? existingAffirmation.affirmation_index : null
    });

  } catch (error) {
    console.error('Check affirmation error:', error);
    res.status(500).json({ error: 'Failed to check affirmation status' });
  }
});

// API endpoint to get user points
app.get('/api/user-points', requireAuth, async (req, res) => {
  try {
    const { data: userPoints, error } = await supabase
      .from('user_points')
      .select('total_points, lifetime_points')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching user points:', error);
      return res.status(500).json({ error: 'Failed to fetch user points' });
    }

    res.json({ 
      total_points: userPoints?.total_points || 0,
      lifetime_points: userPoints?.lifetime_points || 0
    });

  } catch (error) {
    console.error('User points error:', error);
    res.status(500).json({ error: 'Failed to fetch user points' });
  }
});

// API endpoint to get user username
app.get('/api/user-username', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('user_id', req.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.json({ 
      username: profile?.username || null
    });
  } catch (error) {
    console.error('Error fetching username:', error);
    res.status(500).json({ error: 'Failed to fetch username' });
  }
});

// API endpoint to get user level and progress
app.get('/api/user-level', requireAuth, async (req, res) => {
  try {
    const { data: userPoints, error } = await supabase
      .from('user_points')
      .select('total_points, lifetime_points, current_level')
      .eq('user_id', req.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    const lifetimePoints = userPoints?.lifetime_points || 0;
    const currentLevelData = calculateLevel(lifetimePoints);
    const currentLevel = userPoints?.current_level || 1;
    
    // Find next level
    const nextLevelIndex = ACHIEVEMENT_LEVELS.findIndex(l => l.level === currentLevelData.level + 1);
    const nextLevel = nextLevelIndex >= 0 ? ACHIEVEMENT_LEVELS[nextLevelIndex] : null;
    
    // Calculate progress
    const pointsForCurrentLevel = currentLevelData.points;
    const pointsForNextLevel = nextLevel ? nextLevel.points : currentLevelData.points;
    const pointsInCurrentLevel = lifetimePoints - pointsForCurrentLevel;
    const pointsNeededForNext = pointsForNextLevel - pointsForCurrentLevel;
    const progressPercent = nextLevel 
      ? Math.min(100, (pointsInCurrentLevel / pointsNeededForNext) * 100)
      : 100;
    
    res.json({
      level: currentLevelData.level,
      levelName: currentLevelData.name,
      lifetimePoints,
      currentPoints: lifetimePoints,
      pointsForNextLevel: nextLevel ? nextLevel.points : null,
      pointsNeeded: nextLevel ? pointsForNextLevel - lifetimePoints : 0,
      progressPercent: Math.round(progressPercent * 100) / 100, // Round to 2 decimal places
      isMaxLevel: !nextLevel
    });
  } catch (error) {
    console.error('Error fetching user level:', error);
    res.status(500).json({ error: 'Failed to fetch user level' });
  }
});

// API endpoint to get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    // Get top users by lifetime points with their current level
    const { data: topUsers, error } = await supabase
      .from('user_points')
      .select(`
        user_id,
        lifetime_points,
        current_level
      `)
      .order('lifetime_points', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Get usernames for all users in one query
    const userIds = topUsers.map(u => u.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, username')
      .in('user_id', userIds);
    
    // Create a map of user_id to username
    const usernameMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        usernameMap.set(profile.user_id, profile.username);
      });
    }
    
    // Format response with username
    const leaderboard = topUsers.map((user, index) => {
      const levelData = calculateLevel(user.lifetime_points || 0);
      const username = usernameMap.get(user.user_id) || `user_${user.user_id.substring(0, 8)}`;
      return {
        rank: index + 1,
        userId: user.user_id,
        username: username,
        lifetimePoints: user.lifetime_points || 0,
        level: user.current_level || levelData.level,
        levelName: levelData.name
      };
    });
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ==============================================
// MODIFIED GENERATION ENDPOINT
// ==============================================

app.post('/api/generate-timeline', requireAuth, timelineGenerationLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { outcome, context, availableResources, preferredApproach, timeframe, birthDate, birthTime, latitude, longitude } = req.body;
    
    // Validate input
    if (!outcome || !timeframe || !birthDate || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', req.user.id)
      .single();

    if (creditsError) throw creditsError;

    if (!credits || credits.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Default to 12:00 PM if no birth time provided
    const finalBirthTime = birthTime || '12:00';
    
    console.log(`Generating action timeline for user ${req.user.id}: ${outcome}`);
    console.log(`Timeframe: ${timeframe} months`);
    
    // Calculate natal chart
    console.log('Calculating natal chart...');
    const natalChart = calculateNatalChart(birthDate, finalBirthTime, latitude, longitude);
    
    // Calculate transits for the specified timeframe
    const days = Math.floor(timeframe * 30.5);
    console.log(`Calculating transits for ${days} days starting from today...`);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const allTransits = calculateTransitAspects(natalChart, todayStr, days);
    
    console.log(`Found ${allTransits.length} total transits`);
    
    // Select most significant transits
    const numTransits = Math.min(15, Math.max(8, Math.floor(timeframe * 3)));
    const significantTransits = selectSignificantTransits(allTransits, numTransits);
    
    console.log(`Selected ${significantTransits.length} significant transits`);
    
    // Generate action timeline
    console.log('Generating action plan...');
    const actions = await generateActionTimeline(
      outcome, 
      context || "No additional context provided", 
      availableResources || "No specific resources mentioned",
      preferredApproach || "balanced",
      timeframe, 
      significantTransits
    );
    
    // Generate timeline affirmations
    console.log('Generating timeline affirmations...');
    const totalDays = timeframe * 30;
    const timelineAffirmations = await generateTimelineAffirmations(totalDays, outcome, context, significantTransits);
    
    const calculationTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`Complete! Generated ${actions.length} actions and ${timelineAffirmations.length} affirmations in ${calculationTime} seconds`);
    
    // Check if generation was successful
    if (actions.length === 0) {
      console.error('Generation failed: No actions generated');
      return res.status(500).json({ 
        error: 'Failed to generate actions. Please try again.',
        creditsUsed: 0
      });
    }
    
    // Create a temporary generation ID for unsaved timelines
    const tempGenerationId = `temp_${Date.now()}_${req.user.id}`;
    
    // Note: Daily affirmations will be created when the timeline is saved
    // For now, we'll just return the tempGenerationId for frontend use
    console.log(`Generated temp generation ID: ${tempGenerationId}`);
    
    // Note: Timeline is no longer auto-saved. Users must manually save via the Save Timeline button.

    // Only deduct credit if generation was successful
    await supabase
      .from('user_credits')
      .update({ credits: credits.credits - 1 })
      .eq('user_id', req.user.id);

    // Log credit transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: req.user.id,
        amount: -1,
        type: 'used',
        source: 'generation'
      });

    // Award points for first generation
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('lifetime_points')
      .eq('user_id', req.user.id)
      .single();

    if (pointsError && pointsError.code === 'PGRST116') {
      // First generation - award bonus points using awardPoints helper (handles level ups)
      await awardPoints(
        req.user.id, 
        POINTS_SYSTEM.first_generation, 
        'first_generation', 
        'First timeline generation'
      );
    }

    res.json({
      actions: actions,
      timelineAffirmations: timelineAffirmations,
      tempGenerationId: tempGenerationId,
      summary: {
        actionsGenerated: actions.length,
        calculationTime: calculationTime,
        timeframe: timeframe,
        transitsUsed: significantTransits.length
      },
      creditsUsed: 1
    });
    
  } catch (error) {
    console.error('Generate timeline error:', error);
    res.status(500).json({ error: 'Failed to generate timeline' });
  }
});

// ==============================================
// ACTION PROGRESS ENDPOINTS
// ==============================================

app.get('/api/action-progress/:generationId', requireAuth, async (req, res) => {
  try {
    const { generationId } = req.params;

    const { data: progress, error } = await supabase
      .from('user_action_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('generation_id', generationId)
      .order('action_index');

    if (error) throw error;

    res.json({ generationId, progress });
  } catch (error) {
    console.error('Get action progress error:', error);
    res.status(500).json({ error: 'Failed to get action progress' });
  }
});

app.post('/api/action-progress', requireAuth, async (req, res) => {
  try {
    const { generationId, actionIndex, completed, skipped } = req.body;

    if (!generationId || actionIndex === undefined) {
      return res.status(400).json({ error: 'Generation ID and action index are required' });
    }

    // Upsert progress record
    const { data: progress, error: progressError } = await supabase
      .from('user_action_progress')
      .upsert({
        user_id: req.user.id,
        generation_id: generationId,
        action_index: actionIndex,
        completed: completed || false,
        skipped: skipped || false,
        completed_at: completed ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (progressError) throw progressError;

    let pointsEarned = 0;
    let levelUpResult = null;
    if (completed) {
      pointsEarned = POINTS_SYSTEM.action_completed;
      
      // Award points using the awardPoints helper (which handles level ups)
      levelUpResult = await awardPoints(
        req.user.id, 
        pointsEarned, 
        'action_completed', 
        `Completed action #${actionIndex + 1}`
      );
    }

    res.json({ 
      success: true, 
      pointsEarned,
      levelUp: levelUpResult?.leveledUp ? {
        newLevel: levelUpResult.newLevel,
        levelName: levelUpResult.levelName,
        previousLevel: levelUpResult.previousLevel
      } : null
    });
  } catch (error) {
    console.error('Update action progress error:', error);
    res.status(500).json({ error: 'Failed to update action progress' });
  }
});

// ==============================================
// HISTORY ENDPOINTS
// ==============================================

app.get('/api/history', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { data: generations, error } = await supabase
      .from('action_timeline_generations')
      .select('id, outcome, context, timeframe, actions, summary, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count
    const { count, error: countError } = await supabase
      .from('action_timeline_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (countError) throw countError;

    // Get progress for each generation
    const generationsWithProgress = await Promise.all(
      generations.map(async (gen) => {
        const { data: progress, error: progressError } = await supabase
          .from('user_action_progress')
          .select('completed, skipped')
          .eq('user_id', req.user.id)
          .eq('generation_id', gen.id);

        if (progressError) {
          console.error('Progress error for generation', gen.id, progressError);
          return {
            ...gen,
            actionsCount: gen.actions?.length || 0,
            completedActions: 0
          };
        }

        const completedActions = progress.filter(p => p.completed).length;
        
        return {
          ...gen,
          actionsCount: gen.actions?.length || 0,
          completedActions
        };
      })
    );

    res.json({
      generations: generationsWithProgress,
      pagination: {
        page,
        limit,
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

app.get('/api/history/:generationId', requireAuth, async (req, res) => {
  try {
    const { generationId } = req.params;

    const { data: generation, error } = await supabase
      .from('action_timeline_generations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('id', generationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Generation not found' });
      }
      throw error;
    }

    res.json(generation);
  } catch (error) {
    console.error('Get generation error:', error);
    res.status(500).json({ error: 'Failed to get generation' });
  }
});

// ==============================================
// PROFILE ENDPOINTS
// ==============================================

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    // Get user stats
    const [pointsResult, generationsResult, progressResult] = await Promise.all([
      supabase
        .from('user_points')
        .select('total_points, lifetime_points')
        .eq('user_id', req.user.id)
        .single(),
      supabase
        .from('action_timeline_generations')
        .select('id')
        .eq('user_id', req.user.id),
      supabase
        .from('user_action_progress')
        .select('completed, created_at')
        .eq('user_id', req.user.id)
        .eq('completed', true)
    ]);

    const points = pointsResult.data || { total_points: 0, lifetime_points: 0 };
    const totalGenerations = generationsResult.data?.length || 0;
    const completedActions = progressResult.data?.length || 0;

    // Calculate streak (simplified - consecutive days with completed actions)
    const actionDates = progressResult.data?.map(p => new Date(p.created_at).toDateString()) || [];
    const uniqueDates = [...new Set(actionDates)].sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toDateString();
      
      if (uniqueDates.includes(dateStr)) {
        if (i === 0) currentStreak = 1;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        createdAt: req.user.created_at
      },
      stats: {
        totalGenerations,
        totalActionsCompleted: completedActions,
        currentStreak,
        longestStreak,
        totalPoints: points.total_points,
        lifetimePoints: points.lifetime_points
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ==============================================
// LEGACY ENDPOINT (for Phase 1 compatibility)
// ==============================================

app.post('/api/generate-timeline-legacy', async (req, res) => {
  // This is the original Phase 1 endpoint without authentication
  // Keep for backward compatibility during transition
  const startTime = Date.now();
  
  try {
    const { outcome, context, availableResources, preferredApproach, timeframe, birthDate, birthTime, latitude, longitude } = req.body;
    
    if (!outcome || !timeframe || !birthDate || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const finalBirthTime = birthTime || '12:00';
    
    console.log(`Generating action timeline for: ${outcome}`);
    console.log(`Timeframe: ${timeframe} months`);
    
    const natalChart = calculateNatalChart(birthDate, finalBirthTime, latitude, longitude);
    
    const days = Math.floor(timeframe * 30.5);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const allTransits = calculateTransitAspects(natalChart, todayStr, days);
    
    const numTransits = Math.min(15, Math.max(8, Math.floor(timeframe * 3)));
    const significantTransits = selectSignificantTransits(allTransits, numTransits);
    
    const actions = await generateActionTimeline(
      outcome, 
      context || "No additional context provided", 
      availableResources || "No specific resources mentioned",
      preferredApproach || "balanced",
      timeframe, 
      significantTransits
    );
    const totalDays = timeframe * 30;
    const timelineAffirmations = await generateTimelineAffirmations(totalDays, outcome, context, significantTransits);
    
    const calculationTime = Math.round((Date.now() - startTime) / 1000);
    
    res.json({
      actions: actions,
      timelineAffirmations: timelineAffirmations,
      summary: {
        actionsGenerated: actions.length,
        calculationTime: calculationTime,
        timeframe: timeframe,
        transitsUsed: significantTransits.length
      }
    });
    
  } catch (error) {
    console.error('Generate timeline error:', error);
    res.status(500).json({ error: 'Failed to generate timeline' });
  }
});

// ==============================================
// HEALTH CHECK AND UTILITY ENDPOINTS
// ==============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ephemerisPath });
});

app.get('/api/geocode', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters' });
    }
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EternionApp/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match your frontend interface
    const suggestions = data.map((item) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon
    }));
    
    res.json(suggestions);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Location search failed' });
  }
});

// ==============================================
// STRIPE SUBSCRIPTION ENDPOINTS
// ==============================================

// Get user's current subscription status
app.get('/api/user-subscription', requireAuth, async (req, res) => {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_tiers (
          name,
          monthly_credits,
          max_timeframe,
          can_see_all_actions,
          price_monthly,
          price_yearly
        )
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!subscription) {
      // Return free tier if no subscription found
      const { data: freeTier } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('name', 'free')
        .single();

      return res.json({
        tier: freeTier,
        status: 'active',
        isFree: true
      });
    }

    res.json({
      tier: subscription.subscription_tiers,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      isFree: subscription.subscription_tiers.name === 'free'
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Get subscription tiers
app.get('/api/subscription-tiers', async (req, res) => {
  try {
    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) throw error;

    res.json(tiers);
  } catch (error) {
    console.error('Tiers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription tiers' });
  }
});

// Create Stripe customer and subscription
// Create Stripe Checkout Session for subscription
app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get or create Stripe customer
    let customerId;
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .maybeSingle();
    
    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { user_id: req.user.id }
      });
      customerId = customer.id;
      
      // Save the customer ID
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', req.user.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/timeline?success=true`,
      cancel_url: `${req.headers.origin}/timeline?canceled=true`,
      metadata: {
        user_id: req.user.id,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Stripe Checkout Session for credit purchase
app.post('/api/create-credits-checkout', requireAuth, async (req, res) => {
  try {
    const { priceId, credits } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get or create Stripe customer
    let customerId;
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .maybeSingle();
    
    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { user_id: req.user.id }
      });
      customerId = customer.id;
      
      // Save the customer ID
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', req.user.id);
    }

    // Create Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: `${req.headers.origin}/timeline?credits=true`,
      cancel_url: `${req.headers.origin}/timeline?canceled=true`,
      metadata: {
        user_id: req.user.id,
        credits: credits || 3,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Credits checkout session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Purchase extra credits (OLD - keeping for compatibility)
app.post('/api/purchase-credits', requireAuth, async (req, res) => {
  try {
    const { credits, amount } = req.body;
    
    if (!credits || !amount) {
      return res.status(400).json({ error: 'Credits and amount are required' });
    }

    // Get or create Stripe customer
    let customer;
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (existingSubscription?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id);
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { user_id: req.user.id }
      });
      
      // Save the customer ID to the database immediately
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', req.user.id);
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      metadata: {
        user_id: req.user.id,
        credits: credits,
        type: 'credit_purchase'
      }
    });
    
    // Save purchase record
    await supabase
      .from('credit_purchases')
      .insert({
        user_id: req.user.id,
        stripe_payment_intent_id: paymentIntent.id,
        credits_purchased: credits,
        amount_paid: amount,
        status: 'pending'
      });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Credit purchase error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and update credits
// Complete subscription after setup intent
app.post('/api/complete-subscription', requireAuth, async (req, res) => {
  try {
    const { setupIntentId, priceId } = req.body;
    
    if (!setupIntentId || !priceId) {
      return res.status(400).json({ error: 'Setup intent ID and price ID are required' });
    }

    // Retrieve the setup intent
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Setup intent not completed' });
    }

    // Get customer ID
    const customerId = setupIntent.customer;
    const paymentMethodId = setupIntent.payment_method;

    // Attach payment method to customer as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
    });

    // Get tier ID from price ID
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('id')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();
    
    if (!tier) {
      throw new Error('Invalid price ID');
    }

    // Update user subscription in database
    await supabase
      .from('user_subscriptions')
      .update({
        tier_id: tier.id,
        stripe_subscription_id: subscription.id,
        status: 'active',
        current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
      })
      .eq('user_id', req.user.id);

    // Update user credits
    await supabase
      .from('user_credits')
      .update({ credits: tier.monthly_credits || 10 })
      .eq('user_id', req.user.id);

    res.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    console.error('Complete subscription error:', error);
    res.status(500).json({ error: 'Failed to complete subscription' });
  }
});

app.post('/api/confirm-payment', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId, type } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    if (type === 'credit_purchase') {
      // Update credit purchase status
      const { data: purchase, error: purchaseError } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('user_id', req.user.id)
        .single();

      if (purchaseError || !purchase) {
        throw new Error('Purchase record not found');
      }

      // Update purchase status
      await supabase
        .from('credit_purchases')
        .update({ status: 'completed' })
        .eq('id', purchase.id);

      // Add credits to user
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('purchased_credits')
        .eq('user_id', req.user.id)
        .single();

      const newPurchasedCredits = (userCredits?.purchased_credits || 0) + purchase.credits_purchased;

      await supabase
        .from('user_credits')
        .update({ 
          purchased_credits: newPurchasedCredits,
          credits: (userCredits?.credits || 0) + purchase.credits_purchased
        })
        .eq('user_id', req.user.id);

      res.json({ 
        success: true, 
        creditsAdded: purchase.credits_purchased,
        message: `Successfully added ${purchase.credits_purchased} credits!`
      });
    } else {
      // Handle subscription confirmation
      res.json({ success: true, message: 'Subscription activated!' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Create Stripe Customer Portal session for subscription management
app.post('/api/create-portal-session', requireAuth, async (req, res) => {
  try {
    // Get user's Stripe customer ID from database
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Check if user has a Stripe customer ID
    if (!subscription?.stripe_customer_id) {
      return res.status(400).json({ 
        error: 'No active subscription found. Please upgrade to Premium first.' 
      });
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${req.headers.origin}/timeline?portal=returned`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session creation error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ==============================================
// SERVER STARTUP
// ==============================================

app.listen(PORT, () => {
  console.log(`🚀 Eternion Timeline Generator Phase 2 Server running on port ${PORT}`);
  console.log(`📊 Supabase connected: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`🤖 OpenAI connected: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`📅 Swiss Ephemeris loaded: ${ephemerisPath}`);
});

module.exports = app;

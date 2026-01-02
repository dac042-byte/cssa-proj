// ========================================
// QUOTA-MANAGED VERSION (SCALABLE + FREE)
// Implements user quotas and API key rotation
// ========================================

/**
 * This version manages costs at scale by:
 * 1. Limiting users to N requests per day (e.g., 10)
 * 2. Rotating between multiple free Gemini API keys
 * 3. Tracking usage in Vercel KV or Upstash Redis (optional)
 *
 * Free tier scaling:
 * - 10 Gemini keys = 15,000 requests/day = 450k/month
 * - With 10 req/user/day = 1,500 daily active users
 * - With 5 req/user/day = 3,000 daily active users
 */

// ========================================
// CONFIGURATION
// ========================================

const QUOTA_PER_USER_PER_DAY = 10; // Free tier: 10 analyses per user per day

// Multiple Gemini API keys (create multiple free accounts if needed)
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  // Add more keys as needed
].filter(Boolean); // Remove undefined keys

// Simple in-memory rate limiting (resets on function cold start)
// For production, use Vercel KV or Upstash Redis
const userUsage = new Map();

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getUserId(req) {
  // Generate user ID from IP + User-Agent (anonymous but trackable)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return require('crypto').createHash('sha256').update(ip + userAgent).digest('hex').slice(0, 16);
}

function checkQuota(userId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `${userId}:${today}`;

  const usage = userUsage.get(key) || 0;

  if (usage >= QUOTA_PER_USER_PER_DAY) {
    return { allowed: false, remaining: 0, resetIn: getTimeUntilMidnight() };
  }

  return { allowed: true, remaining: QUOTA_PER_USER_PER_DAY - usage - 1 };
}

function incrementUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;
  userUsage.set(key, (userUsage.get(key) || 0) + 1);
}

function getTimeUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((tomorrow - now) / 1000 / 60 / 60);
  return `${hoursLeft} hours`;
}

function getApiKey() {
  // Round-robin API key selection
  const index = Math.floor(Date.now() / 1000) % API_KEYS.length;
  return API_KEYS[index];
}

// ========================================
// MAIN HANDLER
// ========================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ========================================
  // CHECK QUOTA
  // ========================================
  const userId = getUserId(req);
  const quotaCheck = checkQuota(userId);

  if (!quotaCheck.allowed) {
    return res.status(429).json({
      error: `Daily limit reached (${QUOTA_PER_USER_PER_DAY} analyses per day). Resets in ${quotaCheck.resetIn}.`,
      quotaRemaining: 0,
      resetIn: quotaCheck.resetIn
    });
  }

  // ========================================
  // VALIDATE API KEYS
  // ========================================
  if (API_KEYS.length === 0) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // ========================================
  // PROCESS REQUEST (same as before)
  // ========================================
  const { thought, classification, chosen_distortions, evidence_choice } = req.body;

  if (!thought || typeof thought !== 'string' || thought.trim().length === 0) {
    return res.status(400).json({ error: 'Thought is required' });
  }

  if (thought.trim().length > 2000) {
    return res.status(400).json({ error: 'Thought is too long (max 2000 characters)' });
  }

  const sanitizedThought = thought.trim();
  const sanitizedClassification = classification || 'unknown';
  const sanitizedDistortions = Array.isArray(chosen_distortions) ? chosen_distortions : [];
  const sanitizedEvidence = evidence_choice || 'unknown';

  // ========================================
  // CALL GEMINI API
  // ========================================
  const prompt = `You are a CBT-style cognitive reappraisal assistant.

User's thought: "${sanitizedThought}"
Classified as: ${sanitizedClassification}
Suspected distortions: ${sanitizedDistortions.join(', ') || 'none'}
Evidence: ${sanitizedEvidence}

Return ONLY valid JSON:
{
  "type": "Brief label",
  "distortions": ["Array of distortions"],
  "assumptions_vs_facts": "Assumptions vs observable facts",
  "grounded_reframe": "Neutral restatement"
}`;

  try {
    const apiKey = getApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        // If one key hits limit, try another
        console.warn('API key rate limited, will use another key next request');
      }

      return res.status(500).json({
        error: 'AI service temporarily unavailable. Please try again.',
        details: errorData.error?.message
      });
    }

    const data = await response.json();
    const completion = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!completion) {
      return res.status(500).json({ error: 'Invalid AI response' });
    }

    const parsedResponse = JSON.parse(completion);

    // Validate response
    if (!parsedResponse.type || !parsedResponse.distortions ||
        !parsedResponse.assumptions_vs_facts || !parsedResponse.grounded_reframe) {
      return res.status(500).json({ error: 'Incomplete AI response' });
    }

    if (!Array.isArray(parsedResponse.distortions)) {
      parsedResponse.distortions = [parsedResponse.distortions];
    }

    // ========================================
    // INCREMENT USAGE & RETURN
    // ========================================
    incrementUsage(userId);

    return res.status(200).json({
      ...parsedResponse,
      quotaRemaining: quotaCheck.remaining
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Unexpected error. Please try again.',
      details: error.message
    });
  }
}

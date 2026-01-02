// ========================================
// VERCEL SERVERLESS FUNCTION - GEMINI VERSION (FREE)
// Interspace Backend - Google Gemini Integration
// ========================================

/**
 * FREE API VERSION using Google Gemini 1.5 Flash
 *
 * Free tier: 15 req/min, 1500 req/day
 * Get API key: https://aistudio.google.com/app/apikey
 *
 * Required environment variable:
 * - GEMINI_API_KEY: Your Google AI Studio API key
 */

export default async function handler(req, res) {
  // ========================================
  // CORS Headers
  // ========================================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ========================================
  // Validate Request Method
  // ========================================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  // ========================================
  // Validate Environment Variables
  // ========================================
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // ========================================
  // Parse and Validate Request Body
  // ========================================
  const { thought, classification, chosen_distortions, evidence_choice } = req.body;

  if (!thought || typeof thought !== 'string') {
    return res.status(400).json({ error: 'Thought is required and must be a string' });
  }

  const sanitizedThought = thought.trim();
  if (sanitizedThought.length === 0) {
    return res.status(400).json({ error: 'Thought cannot be empty' });
  }

  if (sanitizedThought.length > 2000) {
    return res.status(400).json({ error: 'Thought is too long (max 2000 characters)' });
  }

  const sanitizedClassification = classification || 'unknown';
  const sanitizedDistortions = Array.isArray(chosen_distortions) ? chosen_distortions : [];
  const sanitizedEvidence = evidence_choice || 'unknown';

  // ========================================
  // Construct Gemini API Request
  // ========================================

  const prompt = `You are a CBT-style cognitive reappraisal assistant. Your role is to help users examine their thoughts with precision and neutrality.

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON with these exact keys: type, distortions, assumptions_vs_facts, grounded_reframe
- NO advice, NO diagnosis, NO reassurance, NO positivity
- Be neutral, precise, and evidence-based
- Use the user's selections as hints but correct them if they're clearly wrong
- Keep all fields concise and direct

User's thought: "${sanitizedThought}"

User classified this as: ${sanitizedClassification}
User suspects these distortions: ${sanitizedDistortions.join(', ') || 'none selected'}
User says direct evidence exists: ${sanitizedEvidence}

Return ONLY valid JSON in this exact format:
{
  "type": "Brief label: Interpretation/Prediction/Observation/etc.",
  "distortions": ["Array of specific cognitive distortions present"],
  "assumptions_vs_facts": "Short paragraph explicitly separating what is assumed vs what is observable/factual",
  "grounded_reframe": "One neutral, accurate restatement that acknowledges both facts and uncertainties without false reassurance"
}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
      responseMimeType: "application/json"
    }
  };

  // ========================================
  // Call Gemini API
  // ========================================
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);

      // Handle rate limits
      if (geminiResponse.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment and try again.'
        });
      }

      // Handle quota exceeded
      if (geminiResponse.status === 403) {
        return res.status(403).json({
          error: 'API quota exceeded or invalid API key.'
        });
      }

      return res.status(500).json({
        error: 'AI service error. Please try again.',
        details: errorData.error?.message || 'Unknown error'
      });
    }

    const geminiData = await geminiResponse.json();

    // ========================================
    // Parse and Validate Gemini Response
    // ========================================
    const completion = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!completion) {
      console.error('No completion in Gemini response:', geminiData);
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completion);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', completion);
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    // Validate required fields
    if (!parsedResponse.type || !parsedResponse.distortions ||
        !parsedResponse.assumptions_vs_facts || !parsedResponse.grounded_reframe) {
      console.error('Missing required fields in Gemini response:', parsedResponse);
      return res.status(500).json({ error: 'Incomplete response from AI service' });
    }

    // Ensure distortions is an array
    if (!Array.isArray(parsedResponse.distortions)) {
      parsedResponse.distortions = [parsedResponse.distortions];
    }

    // ========================================
    // Return Successful Response
    // ========================================
    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
      details: error.message
    });
  }
}

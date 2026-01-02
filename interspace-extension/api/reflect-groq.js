// ========================================
// VERCEL SERVERLESS FUNCTION - GROQ VERSION (FREE + SUPER FAST)
// Interspace Backend - Groq Integration
// ========================================

/**
 * FREE API VERSION using Groq (Llama 3.1 8B)
 *
 * Free tier: 30 req/min, 14,400 req/day
 * Ultra-fast inference (<1 second)
 * Get API key: https://console.groq.com/
 *
 * Required environment variable:
 * - GROQ_API_KEY: Your Groq API key
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY environment variable is not set');
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
  // Construct Groq API Request
  // ========================================

  const systemPrompt = `You are a CBT-style cognitive reappraisal assistant. Your role is to help users examine their thoughts with precision and neutrality.

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON with these exact keys: type, distortions, assumptions_vs_facts, grounded_reframe
- NO advice, NO diagnosis, NO reassurance, NO positivity
- Be neutral, precise, and evidence-based
- Use the user's selections as hints but correct them if they're clearly wrong
- Keep all fields concise and direct

OUTPUT FORMAT (JSON only):
{
  "type": "Brief label: Interpretation/Prediction/Observation/etc.",
  "distortions": ["Array of specific cognitive distortions present"],
  "assumptions_vs_facts": "Short paragraph explicitly separating what is assumed vs what is observable/factual",
  "grounded_reframe": "One neutral, accurate restatement that acknowledges both facts and uncertainties without false reassurance"
}`;

  const userPrompt = `User's thought: "${sanitizedThought}"

User classified this as: ${sanitizedClassification}
User suspects these distortions: ${sanitizedDistortions.join(', ') || 'none selected'}
User says direct evidence exists: ${sanitizedEvidence}

Analyze this thought and return your response as valid JSON only.`;

  const requestBody = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 800
  };

  // ========================================
  // Call Groq API
  // ========================================
  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      console.error('Groq API Error:', errorData);

      // Handle rate limits
      if (groqResponse.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment and try again.'
        });
      }

      return res.status(500).json({
        error: 'AI service error. Please try again.',
        details: errorData.error?.message || 'Unknown error'
      });
    }

    const groqData = await groqResponse.json();

    // ========================================
    // Parse and Validate Groq Response
    // ========================================
    const completion = groqData.choices?.[0]?.message?.content;

    if (!completion) {
      console.error('No completion in Groq response:', groqData);
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completion);
    } catch (parseError) {
      console.error('Failed to parse Groq JSON response:', completion);
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    // Validate required fields
    if (!parsedResponse.type || !parsedResponse.distortions ||
        !parsedResponse.assumptions_vs_facts || !parsedResponse.grounded_reframe) {
      console.error('Missing required fields in Groq response:', parsedResponse);
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

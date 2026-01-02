// ========================================
// VERCEL SERVERLESS FUNCTION
// Interspace Backend - OpenAI Integration
// ========================================

/**
 * This function accepts POST requests from the Interspace extension
 * and calls the OpenAI API to generate CBT-style cognitive reappraisals.
 *
 * Required environment variable:
 * - OPENAI_API_KEY: Your OpenAI API key
 *
 * Request body:
 * - thought: string (required)
 * - classification: string (user's choice: fact/thought/prediction)
 * - chosen_distortions: array of strings
 * - evidence_choice: string (yes/no)
 */

export default async function handler(req, res) {
  // ========================================
  // CORS Headers
  // ========================================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // ========================================
  // Parse and Validate Request Body
  // ========================================
  let body;
  try {
    body = req.body;
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  const { thought, classification, chosen_distortions, evidence_choice } = body;

  // Validate thought
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

  // Validate optional fields
  const sanitizedClassification = classification || 'unknown';
  const sanitizedDistortions = Array.isArray(chosen_distortions) ? chosen_distortions : [];
  const sanitizedEvidence = evidence_choice || 'unknown';

  // ========================================
  // Construct OpenAI API Request
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
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 800
  };

  // ========================================
  // Call OpenAI API
  // ========================================
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API Error:', errorData);

      // Handle rate limits
      if (openaiResponse.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
      }

      // Handle other OpenAI errors
      return res.status(500).json({
        error: 'AI service error. Please try again.',
        details: errorData.error?.message || 'Unknown error'
      });
    }

    const openaiData = await openaiResponse.json();

    // ========================================
    // Parse and Validate OpenAI Response
    // ========================================
    const completion = openaiData.choices?.[0]?.message?.content;

    if (!completion) {
      console.error('No completion in OpenAI response:', openaiData);
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completion);
    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON response:', completion);
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    // Validate required fields
    if (!parsedResponse.type || !parsedResponse.distortions || !parsedResponse.assumptions_vs_facts || !parsedResponse.grounded_reframe) {
      console.error('Missing required fields in OpenAI response:', parsedResponse);
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

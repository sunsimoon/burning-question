// netlify/functions/refine-observation.js

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { 
            step,
            stepTitle,
            currentResponse, 
            currentObservation, 
            refinementFeedback,
            previousResponses 
        } = JSON.parse(event.body);

        // Build context
        let conversationContext = '';
        for (let i = 1; i < step; i++) {
            if (previousResponses[i]) {
                conversationContext += `Step ${i}: ${previousResponses[i]}\n\n`;
            }
        }

        const systemPrompt = `You are a thoughtful observer helping someone discover their burning question. You're now refining your observation based on their feedback about what you might have missed or misunderstood. Adjust your observation to better reflect their perspective while still offering valuable insight.`;

        const userPrompt = `Previous context:
${conversationContext}

Current step (${step}): ${stepTitle}
User's response: ${currentResponse}

Your initial observation: ${currentObservation}

The user's refinement feedback: "${refinementFeedback}"

Based on this feedback, provide a refined observation that better captures what they're pointing to. Acknowledge their correction or addition, and offer a revised insight that incorporates their perspective. Keep it brief (2-3 sentences) and helpful.`;

        // Call Anthropic API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 300,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const refinedObservation = data.content[0].text;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ refinedObservation })
        };

    } catch (error) {
        console.error('Error in refine-observation function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to refine observation',
                details: error.message 
            })
        };
    }
};

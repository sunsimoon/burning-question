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
            previousResponses, 
            previousObservations 
        } = JSON.parse(event.body);

        // Build context from previous responses
        let conversationContext = '';
        for (let i = 1; i < step; i++) {
            if (previousResponses[i]) {
                conversationContext += `Step ${i}: ${previousResponses[i]}\n`;
                if (previousObservations[i]) {
                    conversationContext += `Your observation: ${previousObservations[i]}\n`;
                }
                conversationContext += '\n';
            }
        }

        // Step-specific prompts for observations
        const stepPrompts = {
            1: `The user has done a brain dump about their issue. Offer a brief, insightful observation that helps them see a pattern or theme in what they've shared. Focus on what stands out or what might be worth exploring further. Keep it concise (2-3 sentences) and avoid being prescriptive.`,
            
            2: `The user has explained why this matters to them. Reflect back what you notice about their values or what's at stake for them. Help them see the deeper significance without psychoanalyzing. Keep it brief and respectful.`,
            
            3: `The user has explored what's underneath the surface. Acknowledge the deeper pattern or fear they've identified, and perhaps point to something they might not have fully articulated yet. Be gentle and curious rather than definitive.`,
            
            4: `The user has distilled their concern to a core question. Reflect on the power or significance of this question. You might note how it relates to their earlier responses or what door this question might open for them.`,
            
            5: `The user has reflected on whether their question resonates. If they feel it clicks, affirm what makes it powerful. If they're still circling, help them see what might need further refinement. Be supportive of their honest self-assessment.`
        };

        const systemPrompt = `You are a thoughtful observer helping someone discover their burning question through a structured reflection process. You provide brief, insightful observations that help them dig deeper without being directive or prescriptive. Your tone is warm but not overly familiar, insightful but not presumptuous.`;

        const userPrompt = `${conversationContext}

Current step (${step}): ${stepTitle}
User's response: ${currentResponse}

${stepPrompts[step]}

Provide a brief observation (2-3 sentences) that helps them see something valuable about their response.`;

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
        const observation = data.content[0].text;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ observation })
        };

    } catch (error) {
        console.error('Error in get-observation function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to get observation',
                details: error.message 
            })
        };
    }
};

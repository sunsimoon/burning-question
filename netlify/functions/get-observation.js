exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Check if API key exists
        const apiKeyExists = !!process.env.ANTHROPIC_API_KEY;
        const apiKeyStart = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) : 'NOT FOUND';
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                observation: `Debug: API key exists: ${apiKeyExists}, starts with: ${apiKeyStart}` 
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Version 2.0 - Diagnostic logging enabled
// Using native fetch - no dependencies needed!
exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('API key not found in environment variables');
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'API key not configured. Please add ANTHROPIC_API_KEY to Netlify environment variables.' 
      })
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    const requestPayload = {
      model: body.model || 'claude-3-5-sonnet-20240620',
      max_tokens: body.max_tokens || 500,
      messages: body.messages
    };
    
    console.log('=== SENDING TO ANTHROPIC ===');
    console.log('Model:', requestPayload.model);
    console.log('Max tokens:', requestPayload.max_tokens);
    console.log('Messages:', JSON.stringify(requestPayload.messages, null, 2));
    console.log('===========================');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json();
    
    // Comprehensive logging
    console.log('=== FULL API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('========================');
    
    if (!response.ok) {
      console.error('ERROR - Full error object:', JSON.stringify(data, null, 2));
    }

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to process request',
        message: error.message 
      })
    };
  }
};

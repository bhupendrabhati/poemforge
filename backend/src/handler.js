'use strict';

const { generatePoem, ValidationError } = require('./generate');

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  let raw;
  try {
    raw = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    return respond(400, { error: 'Request body must be valid JSON.' });
  }

  try {
    const result = await generatePoem(raw);
    return respond(200, result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return respond(400, { error: err.message, fields: err.fields });
    }
    console.error('Generation failed:', err);
    return respond(500, { error: 'Something went wrong while forging your poem. Please try again.' });
  }
};

'use strict';

const { generateEngine, MOODS, STYLES, LENGTHS, _internal } = require('./engine');
const { invokeBedrock } = require('./bedrock');

const { cleanText, hashCode } = _internal;

const TOPIC_MAX = 40;

class ValidationError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields || {};
  }
}

function validateInputs(inputs) {
  const body = inputs && typeof inputs === 'object' ? inputs : {};
  const errors = {};

  if (!MOODS.includes(body.mood)) errors.mood = 'must be one of: ' + MOODS.join(', ');
  if (!STYLES.includes(body.style)) errors.style = 'must be one of: ' + STYLES.join(', ');
  if (!LENGTHS.includes(body.length)) errors.length = 'must be one of: ' + LENGTHS.join(', ');

  let topic = typeof body.topic === 'string' ? cleanText(body.topic) : '';
  if (topic.length > TOPIC_MAX) {
    errors.topic = `must be at most ${TOPIC_MAX} characters`;
  }
  if (topic.length > 0 && topic.length < 2) {
    errors.topic = 'must be at least 2 characters';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid generation inputs', errors);
  }

  return { mood: body.mood, style: body.style, length: body.length, topic };
}

function seedFromInputs(inputs) {
  const minuteBucket = Math.floor(Date.now() / 60000);
  return hashCode(`${inputs.mood}|${inputs.style}|${inputs.length}|${inputs.topic}|${minuteBucket}`);
}

async function generatePoem(rawInputs) {
  const inputs = validateInputs(rawInputs);

  const bedrockResult = await invokeBedrock(inputs);
  if (bedrockResult.ok) {
    return {
      poem: cleanText(bedrockResult.poem),
      title: bedrockResult.title ? cleanText(bedrockResult.title) : undefined,
      usedAi: true,
    };
  }

  const engineResult = generateEngine(inputs, seedFromInputs(inputs));
  return {
    poem: engineResult.poem,
    title: engineResult.title,
    usedAi: false,
  };
}

module.exports = { generatePoem, validateInputs, ValidationError, seedFromInputs };

'use strict';

const DEFAULT_MODEL = 'amazon.nova-micro-v1:0';
const DEFAULT_REGION = 'us-east-1';
const TIMEOUT_MS = 5000;

function buildPrompt({ mood, style, length, topic }) {
  const topicLine = topic ? `Topic: ${topic}` : 'Topic: none (choose something fitting)';
  return [
    'You are the friendly soul of a tiny poetry kiosk. Create an ORIGINAL, delightful, well-crafted short poem in response to the request.',
    '',
    `Mood: ${mood}`,
    `Style: ${style}`,
    `Length: ${length}`,
    topicLine,
    '',
    'Rules:',
    '- "haiku" means a 5-7-5 haiku; "limerick" means a 5-line AABBA limerick; "micro-story" means a very short story in prose.',
    '- "free-verse" and "rhyming" mean short poems; "length" scales the number of lines.',
    '- Weave the topic in naturally when provided.',
    '- Return ONLY valid JSON with exactly two keys: "title" (a short title string) and "poem" (the full text with newlines). No commentary, no markdown fences.',
  ].join('\n');
}

async function invokeBedrock(inputs) {
  let sdk;
  try {
    sdk = require('@aws-sdk/client-bedrock-runtime');
  } catch (err) {
    return { ok: false, error: 'bedrock-sdk-unavailable' };
  }

  const region = process.env.AWS_BEDROCK_REGION || DEFAULT_REGION;
  const modelId = process.env.AWS_BEDROCK_MODEL_ID || DEFAULT_MODEL;

  const maxTokens = { short: 120, medium: 200, long: 320 }[inputs.length] || 200;

  const client = new sdk.BedrockRuntimeClient({ region });

  const payload = {
    inferenceConfig: {
      max_new_tokens: maxTokens,
      temperature: 0.9,
      top_p: 0.95,
    },
    messages: [
      {
        role: 'user',
        content: [{ text: buildPrompt(inputs) }],
      },
    ],
  };

  const command = new sdk.InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const send = client.send(command);
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('bedrock-timeout')), TIMEOUT_MS);
  });

  let response;
  try {
    response = await Promise.race([send, timeout]);
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'bedrock-failed' };
  }

  try {
    const body = JSON.parse(Buffer.from(response.body).toString('utf8'));
    const text =
      body.output && body.output.message && Array.isArray(body.output.message.content)
        ? body.output.message.content.map((c) => (c && c.text) || '').join('')
        : '';
    const parsed = JSON.parse(text.trim());
    if (!parsed || typeof parsed.poem !== 'string' || !parsed.poem.trim()) {
      return { ok: false, error: 'bedrock-invalid-output' };
    }
    return {
      ok: true,
      poem: parsed.poem.trim(),
      title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
    };
  } catch (err) {
    return { ok: false, error: 'bedrock-invalid-output' };
  }
}

module.exports = { invokeBedrock, buildPrompt };

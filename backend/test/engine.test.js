'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { generateEngine, MOODS, STYLES, LENGTHS, _internal } = require('../src/engine');
const { generatePoem, validateInputs, ValidationError, seedFromInputs } = require('../src/generate');

test('engine covers every mood/style/length combo with valid output', () => {
  for (const mood of MOODS) {
    for (const style of STYLES) {
      for (const length of LENGTHS) {
        const result = generateEngine({ mood, style, length, topic: '' }, 42);
        assert.ok(result.poem, `${mood}/${style}/${length} produced empty poem`);
        assert.ok(!String(result.poem).includes('undefined'), `${mood}/${style}/${length} produced "undefined"`);
        assert.ok(!String(result.poem).includes('{topic}'), `${mood}/${style}/${length} left a template slot unfilled`);
      }
    }
  }
});

test('engine is deterministic for identical seed + inputs', () => {
  const a = generateEngine({ mood: 'happy', style: 'free-verse', length: 'medium', topic: 'rain' }, 7);
  const b = generateEngine({ mood: 'happy', style: 'free-verse', length: 'medium', topic: 'rain' }, 7);
  assert.equal(a.poem, b.poem);
});

test('engine varies output across seeds', () => {
  const a = generateEngine({ mood: 'epic', style: 'rhyming', length: 'short', topic: '' }, 1);
  const b = generateEngine({ mood: 'epic', style: 'rhyming', length: 'short', topic: '' }, 999);
  assert.notEqual(a.poem, b.poem);
});

test('haiku is exactly three lines', () => {
  const result = generateEngine({ mood: 'calm', style: 'haiku', length: 'short', topic: '' }, 3);
  assert.equal(result.poem.split('\n').length, 3);
});

test('length scales free-verse line count', () => {
  const short = generateEngine({ mood: 'happy', style: 'free-verse', length: 'short', topic: '' }, 5);
  const long = generateEngine({ mood: 'happy', style: 'free-verse', length: 'long', topic: '' }, 5);
  assert.ok(long.poem.split('\n').length > short.poem.split('\n').length);
});

test('topic is woven into the output', () => {
  const result = generateEngine({ mood: 'curious', style: 'micro-story', length: 'medium', topic: 'the lost comet' }, 11);
  assert.ok(result.poem.toLowerCase().includes('the lost comet'), `topic missing from: ${result.poem}`);
});

test('title present for non-haiku styles', () => {
  const verse = generateEngine({ mood: 'whimsical', style: 'free-verse', length: 'short', topic: '' }, 2);
  assert.ok(verse.title && verse.title.length > 0);
  const haiku = generateEngine({ mood: 'whimsical', style: 'haiku', length: 'short', topic: '' }, 2);
  assert.equal(haiku.title, undefined);
});

test('micro-story produces at least two sentences for short length', () => {
  const result = generateEngine({ mood: 'melancholy', style: 'micro-story', length: 'short', topic: '' }, 9);
  const sentences = result.poem.split('. ').length;
  assert.ok(sentences >= 2, `expected multiple sentences, got: ${result.poem}`);
});

test('validateInputs accepts a valid payload', () => {
  const out = validateInputs({ mood: 'happy', style: 'haiku', length: 'short', topic: 'ocean' });
  assert.deepEqual(out, { mood: 'happy', style: 'haiku', length: 'short', topic: 'ocean' });
});

test('validateInputs rejects invalid enums', () => {
  assert.throws(
    () => validateInputs({ mood: 'angry', style: 'haiku', length: 'short' }),
    (err) => err instanceof ValidationError && err.fields.mood !== undefined
  );
  assert.throws(
    () => validateInputs({ mood: 'happy', style: 'sonnet', length: 'short' }),
    (err) => err instanceof ValidationError && err.fields.style !== undefined
  );
  assert.throws(
    () => validateInputs({ mood: 'happy', style: 'haiku', length: 'huge' }),
    (err) => err instanceof ValidationError && err.fields.length !== undefined
  );
});

test('validateInputs rejects overlong topics', () => {
  assert.throws(
    () => validateInputs({ mood: 'happy', style: 'haiku', length: 'short', topic: 'x'.repeat(50) }),
    (err) => err instanceof ValidationError && err.fields.topic !== undefined
  );
});

test('seedFromInputs is deterministic for identical inputs', () => {
  assert.equal(seedFromInputs({ mood: 'calm', style: 'rhyming', length: 'long', topic: 'moon' }), seedFromInputs({ mood: 'calm', style: 'rhyming', length: 'long', topic: 'moon' }));
});

test('generatePoem falls back to the engine and reports usedAi false', async () => {
  const result = await generatePoem({ mood: 'calm', style: 'limerick', length: 'short', topic: '' });
  assert.equal(result.usedAi, false);
  assert.ok(result.poem && result.poem.length > 0);
});

test('_internal helpers behave correctly', () => {
  assert.equal(_internal.cleanText('a\n\n\n\nb'), 'a\n\nb');
  assert.equal(_internal.cleanText('ok\u0000strip'), 'okstrip');
});

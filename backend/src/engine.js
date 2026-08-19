'use strict';

const MOODS = ['happy', 'calm', 'curious', 'whimsical', 'melancholy', 'epic'];
const STYLES = ['haiku', 'free-verse', 'rhyming', 'limerick', 'micro-story'];
const LENGTHS = ['short', 'medium', 'long'];

const MOOD_LABELS = {
  happy: 'happy',
  calm: 'calm',
  curious: 'curious',
  whimsical: 'whimsical',
  melancholy: 'melancholy',
  epic: 'epic',
};

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic given a seed
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function cleanText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Weave the user's topic into a template. If no topic is given, fall back to a
// mood-appropriate default noun so every line still reads well.
function fill(template, bank, topic, rng) {
  return template
    .replace(/\{topic\}/g, topic || pick(bank.nouns, rng))
    .replace(/\{adj\}/g, pick(bank.adjectives, rng))
    .replace(/\{noun\}/g, pick(bank.nouns, rng))
    .replace(/\{verb\}/g, pick(bank.verbs, rng))
    .replace(/\{place\}/g, pick(bank.places, rng))
    .replace(/\{time\}/g, pick(bank.times, rng));
}

// ---------------------------------------------------------------------------
// Mood word banks — flavor for free verse, titles and stories
// ---------------------------------------------------------------------------

const WORD_BANKS = {
  happy: {
    nouns: ['sun', 'kite', 'picnic', 'confetti', 'melon', 'bicycle', 'candle', 'sparrow'],
    adjectives: ['golden', 'sparkling', 'giddy', 'honeyed', 'bouncy', 'sunny', 'zesty', 'dancing'],
    verbs: ['giggles', 'glows', 'shimmers', 'skips', 'humming', 'dazzles', 'bubbles', 'soars'],
    places: ['meadow', 'kitchen', 'garden', 'hilltop', 'bakery', 'fair'],
    times: ['morning', 'first light', 'Sunday', 'afternoon', 'harvest time', 'dawn'],
  },
  calm: {
    nouns: ['lake', 'harbor', 'pillow', 'willow', 'candle', 'cove', 'hammock', 'silver'],
    adjectives: ['still', 'soft', 'quiet', 'hazy', 'mellow', 'gentle', 'slow', 'smooth'],
    verbs: ['drifts', 'settles', 'breathes', 'ripples', 'rests', 'unfolds', 'hovers', 'flows'],
    places: ['cove', 'porch', 'shore', 'meadow', 'dock', 'woods'],
    times: ['dusk', 'midnight', 'evening', 'a long Sunday', 'the blue hour', 'nightfall'],
  },
  curious: {
    nouns: ['compass', 'keyhole', 'horizon', 'atlas', 'telescope', 'riddle', 'magnet', 'trail'],
    adjectives: ['hidden', 'quizzical', 'faint', 'unmapped', 'glowing', 'puzzling', 'tiny', 'strange'],
    verbs: ['wonders', 'flickers', 'pokes', 'squints', 'probes', 'murmurs', 'hunts', 'peeks'],
    places: ['library', 'attic', 'observatory', 'back alley', 'moon', 'museum'],
    times: ['three in the morning', 'twilight', 'midnight', 'a foggy noon', 'the witching hour', 'dawn'],
  },
  whimsical: {
    nouns: ['teapot', 'umbrella', 'pigeon', 'accordion', 'pajamas', 'telescope', 'cupcake', 'giraffe'],
    adjectives: ['wobbly', 'polka-dotted', 'crumbly', 'sprightly', 'left-handed', 'fluffy', 'tinny', 'purple'],
    verbs: ['waltzes', 'toodles', 'cavorts', 'giggles', 'pirouettes', 'somersaults', 'quacks', 'doodles'],
    places: ['attic', 'moon', 'greenhouse', 'garden shed', 'pantry', 'dollhouse'],
    times: ['Tuesday', 'half past lunch', 'the third moon', 'breakfast', 'nap time', 'a blustery eve'],
  },
  melancholy: {
    nouns: ['rain', 'letter', 'violin', 'smoke', 'moth', 'gray', 'dust', 'chorus'],
    adjectives: ['hollow', 'rain-soaked', 'quiet', 'faded', 'silvered', 'sleepless', 'distant', 'fragile'],
    verbs: ['drifts', 'fades', 'aches', 'whispers', 'unravels', 'lingers', 'hollows', 'yearns'],
    places: ['station', 'empty room', 'coast', 'back row', 'old house', 'window'],
    times: ['last autumn', 'three a.m.', 'November', 'the long dusk', 'an empty evening', 'winter'],
  },
  epic: {
    nouns: ['thunder', 'banner', 'oath', 'beacon', 'glacier', 'armada', 'quarry', 'crown'],
    adjectives: ['iron', 'roaring', 'ancient', 'unyielding', 'blazing', 'towering', 'fierce', 'unbroken'],
    verbs: ['thunders', 'conquers', 'forges', 'sweeps', 'crashes', 'rises', 'shakes', 'marches'],
    places: ['high pass', 'northern sea', 'burning valley', 'citadel', 'storm edge', 'fjord'],
    times: ['the long night', 'the eleventh hour', 'midwinter', 'the age of embers', 'high noon', 'the old war'],
  },
};

// ---------------------------------------------------------------------------
// Haiku banks — exact 5/7/5 syllables per mood
// ---------------------------------------------------------------------------

const HAIKU_BANKS = {
  happy: {
    l5: ['warm sun on my face', 'birds greet the new day', 'laughter in the air', 'petals drift softly', 'kites dance in the breeze'],
    l7: ['a smiling sky pulls me close', 'golden light spills down the street', 'little joys bloom everywhere', 'the whole world feels light and new', 'sunshine tickles the window'],
  },
  calm: {
    l5: ['still water reflects', 'soft mist on the hills', 'slow breath of the lake', 'moonlight on the pond', 'quiet pine trees sway'],
    l7: ['a gentle hush fills the air', 'the river hums its old song', 'clouds drift past without a sound', 'evening folds into my hands', 'the leaves settle, one by one'],
  },
  curious: {
    l5: ['why do stars blink so', 'what hides in the fog', 'maps with blank corners', 'a door with no keyhole', 'questions float like seeds'],
    l7: ['I wonder what the moon asks', 'trails that no one has walked yet', 'secrets hiding under rocks', 'a compass with no needle', 'curiosity is a lantern'],
  },
  whimsical: {
    l5: ['a teapot that sings', 'clouds wearing red socks', 'spoons waltz on the shelf', 'a hat full of jam', 'the fridge hums a tune'],
    l7: ['the moon wears a tiny tutu', 'penguins picnic on glaciers', 'my umbrella learned to fly', 'cookies dance by the moonlight', 'giraffes ride unicycles'],
  },
  melancholy: {
    l5: ['rain on empty streets', 'letters left unread', 'cold tea on the sill', 'a half-lit window', 'the last leaf lets go'],
    l7: ['the evening keeps its secrets', 'a song no one sings aloud', 'shadows grow longer than me', 'the wind hums a lonely note', 'gray skies fold over the town'],
  },
  epic: {
    l5: ['thunder splits the sky', 'a banner raised high', 'oaths sworn in the dark', 'the sea beats the cliffs', 'war horns shake the hills'],
    l7: ['a thousand fires on the hill', 'steel meets steel upon the field', 'the storm rides down from the peaks', 'iron flags clatter and gleam', 'the old watch burns through the night'],
  },
};

// ---------------------------------------------------------------------------
// Rhyming couplets (AABB) — fixed, mood-flavored, topic woven in
// ---------------------------------------------------------------------------

const COUPLETS = {
  happy: [
    ['The kettle sings a tiny tune,', 'and {topic} sparkles, bright as June.'],
    ['A golden morning taps the glass,', 'let {topic} stroll in, let it pass.'],
    ['The bumblebees all hum along,', 'and {topic} joins the happy song.'],
    ['Confetti drifts across the lawn,', 'and {topic} wakes before the dawn.'],
    ['A skipping stone, a clover sprig,', '{topic} makes the day feel big.'],
  ],
  calm: [
    ['The evening settles, soft and deep,', 'and {topic} folds itself to sleep.'],
    ['A still lake holds the pale moon wide,', 'and {topic} rests the falling tide.'],
    ['The willow leans and holds its breath,', '{topic} unwinds what daylight kept.'],
    ['A candle steadies in the air,', 'and {topic} drifts without a care.'],
    ['The porch swing slows, the crickets call,', 'and {topic} settles after all.'],
  ],
  curious: [
    ['A question taps upon the glass,', 'what does {topic} hide, who lets it pass?'],
    ['The atlas folds to unknown ground,', 'and {topic} hums a muffled sound.'],
    ['A lantern peers around a door,', '{topic} knocks, then asks for more.'],
    ['A compass spins without a pole,', 'and {topic} pulls the restless soul.'],
    ['The library dust begins to dance,', 'and {topic} waits for its next chance.'],
  ],
  whimsical: [
    ['A teacup waltzes off the shelf,', 'and {topic} introduces itself.'],
    ['The moon wears socks of polka dots,', 'and {topic} brings the sausage pots.'],
    ['A pigeon practices its scale,', 'while {topic} wears a swan in tail.'],
    ['The fridge begins to sing in B flat,', 'and {topic} turns the kettle to a hat.'],
    ['A doorknob giggles, then complains,', 'while {topic} rehearses waltz refrains.'],
  ],
  melancholy: [
    ['The rain keeps tapping at the pane,', 'and {topic} falls like old refrain.'],
    ['A letter folded, never sent,', 'and {topic} waits in the lament.'],
    ['The violet hour drains the street,', 'and {topic} echoes, bittersweet.'],
    ['A radio hums a half-remembered line,', 'and {topic} fades like pale moonshine.'],
    ['The porch light flickers, then goes dark,', 'and {topic} lingers with its spark.'],
  ],
  epic: [
    ['The banners rise against the sky,', 'and {topic} swears its oaths or dies.'],
    ['The mountain answers with a shout,', 'and {topic} rides the storm about.'],
    ['The iron drums begin to roll,', 'and {topic} takes the field its own.'],
    ['A beacon blazes on the hill,', 'and {topic} rings the anvil, still.'],
    ['The old ship breaks the white-cap swell,', 'and {topic} greets the deep farewell.'],
  ],
};

// ---------------------------------------------------------------------------
// Limericks (AABBA) — mood-flavored five-liners
// ---------------------------------------------------------------------------

const LIMERICKS = {
  happy: [
    ['There once was a {adj} little mouse', 'who danced through the whole sweet house,', 'with a hop and a cheer', 'it would twirl and appear,', 'and toast all its friends with a {noun}.'],
    ['A {noun} from the {place} said hooray,', 'it would picnic all day, every day,', 'with jam and with cake,', 'for goodness\u2019 own sake,', 'it buttered the clouds, hip-hooray!'],
    ['There once was a {adj} old bell', 'that chimed {topic} so no one could tell,', 'it rang out with glee,', 'one, two, then three,', 'and smiled as the neighbors said swell.'],
  ],
  calm: [
    ['There once was a {adj} slow boat', 'that floated on {time} afloat,', 'it never would rush,', 'just swayed in the hush,', 'and hummed a low lullaby note.'],
    ['A {noun} in the {place} would rest,', 'with {topic} tucked close to its chest,', 'it breathed long and slow,', 'let the quiet hours go,', 'and dreamed of a world at its best.'],
    ['There once was a soft {adj} cloud,', 'that drifted {topic} aloud,', 'it hung in the sky,', 'too gentle to fly,', 'and napped on the {place} shroud.'],
  ],
  curious: [
    ['There once was a {adj} young sleuth,', 'who hunted the truth without ruth,', 'it poked and it pried,', 'left nothing untried,', 'and followed a compass uncouth.'],
    ['A {noun} from the {place} asked why', 'the moon wore a {adj} tie,', 'it climbed up a ladder,', 'got closer and sadder,', 'then found a whole {noun} in the sky.'],
    ['There once was a map with no edge,', 'that grew a {adj} little hedge,', 'it whispered \u201ccome look,\u201d', 'at the bend of the brook,', 'for {topic} was just over the ledge.'],
  ],
  whimsical: [
    ['There once was a {adj} giraffe', 'who practiced {topic} at half past half,', 'it wobbled and swayed,', 'in the {time} parade,', 'and signed every cloud with a laugh.'],
    ['A {noun} who lived under the bed', 'wore {adj} pajamas instead,', 'it tap-danced at noon,', 'and whistled a tune,', 'then served the {place} toast and bread.'],
    ['There once was a teacup from Spain,', 'that sang {topic} again and again,', 'it warbled so shrill,', 'the whole {place} stood still,', 'then clinked to a glorious refrain.'],
  ],
  melancholy: [
    ['There once was a {adj} gray rain,', 'that fell on the {place} in vain,', 'it tapped at the glass,', 'and let the hours pass,', 'then whispered {topic} again.'],
    ['A {noun} from the {place} of sighs,', 'kept a photograph under its eyes,', 'it folded the years,', 'swallowed its tears,', 'and watched the {adj} {time} rise.'],
    ['There once was a lamp on the shore,', 'that lit {topic} and nothing much more,', 'it burned all night through,', 'with no one to woo,', 'and grieved as the fog did its chore.'],
  ],
  epic: [
    ['There once was a {adj} old king,', 'who took {topic} on an iron wing,', 'he rode out at {time},', 'with banners a-flame,', 'and taught every {place} to ring.'],
    ['A {noun} of the {place} swore', 'it would march {topic} forevermore,', 'through thunder and steel,', 'it would never kneel,', 'and carved its {adj} rune on the door.'],
    ['There once was a {adj} sea-captain bold,', 'whose {topic} was {time} untold,', 'he broke on the wave,', 'the storm to enslave,', 'and returned with the {noun} of gold.'],
  ],
};

// ---------------------------------------------------------------------------
// Free-verse fragments — assembled into short/medium/long poems
// ---------------------------------------------------------------------------

const FRAGMENTS = {
  happy: [
    '{topic} arrives like weather made of sugar.',
    'Every pocket in this house is full of {adj} coins.',
    'The {noun} {verb} and the day obliges.',
    'We leave the windows open just to let the {adj} light in.',
    '{topic} hums {time} and the walls hum back.',
    'A {noun} in the {place} is wearing the {adj} morning.',
    'Listen — {topic} is laughing somewhere past the {place}.',
    'The {adj} {noun} of this town {verb} without warning.',
  ],
  calm: [
    '{topic} rests on the water like a held breath.',
    'The {place} keeps its {adj} secret under a layer of {noun}.',
    'Nothing here {verb}. Everything simply settles.',
    '{time} folds itself into the {noun} of the {place}.',
    'A {adj} {noun} leans against the hush.',
    '{topic} is the slow exhale of a {adj} {place}.',
    'The {noun} drifts past the {place} without asking.',
    'Here the {adj} air {verb} at the pace of a candle.',
  ],
  curious: [
    'There is a {adj} {noun} in the {place} asking a question.',
    '{topic} hides in the margin of every {adj} map.',
    'A {noun} nudges the lock of an unopened {time}.',
    'If you listen, the {place} {verb} with directions.',
    '{topic} keeps a {adj} ledger of everything unseen.',
    'Somewhere a {noun} {verb} toward the {place}.',
    'The {adj} trail does not end; it merely {verb}.',
    'Every {time} leaves a {noun} of {topic} behind.',
  ],
  whimsical: [
    '{topic} was last seen waltzing with a {adj} {noun}.',
    'The {place} {verb} at {time}, and no one blames it.',
    'A {adj} {noun} balances a teacup on its nose.',
    '{topic} {verb} whenever the {noun} plays its tune.',
    'The {time} committee voted to make everything {adj}.',
    'Someone taught the {place} a lesson, and it cannot stop.',
    'Beware the {adj} {noun}; it has opinions about {topic}.',
    'Even the {noun} of the {place} is wearing {adj} pajamas.',
  ],
  melancholy: [
    '{topic} fell out of the {time} and could not be caught.',
    'The {place} remembers a {noun} that never came back.',
    'A {adj} {noun} keeps {topic} pressed between its pages.',
    '{time} arrived without the {noun} it promised.',
    'The {adj} {place} is quiet in a particular way.',
    '{topic} {verb} at the edge of an unlit window.',
    'Even the {noun} has learned to be {adj}.',
    'The {place} hums a {noun} that belongs to no one.',
  ],
  epic: [
    '{topic} rises where the {place} meets the iron sky.',
    'A {adj} {noun} marks the ground of every old vow.',
    'When the {place} {verb}, the whole valley listens.',
    '{topic} is written in the {noun} of the {time}.',
    'The {adj} banners of the {place} remember the siege.',
    'From the {place}, a {noun} {verb} like the old war.',
    'Those who held {topic} held the ridge at {time}.',
    'The {adj} {noun} of the {place} shall not break.',
  ],
};

// ---------------------------------------------------------------------------
// Micro-story sentences — assembled into 3-8 sentence mini tales
// ---------------------------------------------------------------------------

const STORY_SENTENCES = {
  happy: [
    '{topic} woke the whole {place} with a {adj} knock.',
    'A {noun} answered the door holding a {adj} umbrella.',
    'Before long, everyone {verb} down the {place}.',
    'The {noun} pulled a {adj} parcel from its pocket.',
    'Inside was a note: \u201ctoday, only {topic} is allowed.\u201d',
    'They {verb} until the {time} turned {adj}.',
    'That night, the {place} glowed like a kind lantern.',
    'And {topic} promised to visit again very soon.',
  ],
  calm: [
    '{topic} arrived at the {place} without a sound.',
    'A {adj} {noun} offered it a seat by the water.',
    'They watched the {time} settle on the {noun}.',
    'Nothing needed to be said; the hush said it all.',
    'Slowly, {topic} let its shoulders drop.',
    'The {place} kept its rhythm, unhurried as breath.',
    'When evening came, {topic} thanked the {adj} dark.',
    'It left the way it came — quiet, and whole.',
  ],
  curious: [
    '{topic} left a trail of {adj} crumbs through the {place}.',
    'A {noun} followed, notebook in hand, squinting hard.',
    'Each crumb hid a question written in tiny {adj} ink.',
    '\u201cWho teaches the moon?\u201d read the first.',
    'The {noun} hunted for the answer all through {time}.',
    'At last it found the source: a {adj} door in the {place}.',
    'Behind it sat {topic}, mid-lecture, to a class of stars.',
    'It waved the {noun} in. \u201cYou\u2019re late,\u201d it said, smiling.',
  ],
  whimsical: [
    'It all began when {topic} borrowed the {place} ladder.',
    'A {adj} {noun} spotted it halfway up a {time} cloud.',
    '\u201cThat is not how the moon works,\u201d it called.',
    '{topic} only winked and polished the {noun} brighter.',
    'The cloud, impressed, followed them home.',
    'They hosted a parade at {time} with a {adj} brass band.',
    'The {place} declared itself a kingdom of {noun}.',
    'And {topic} became its most {adj} royal subject.',
  ],
  melancholy: [
    '{topic} left its coat on the {place} bench and never returned.',
    'The {noun} kept it folded through the {time}.',
    'Rain found the collar; dust found the cuffs.',
    'Every so often someone asked about the owner.',
    'The {adj} {place} answered with a shrug of fog.',
    'Eventually the {noun} gave the coat to the sea.',
    '{topic} washed ashore one spring, lighter, almost new.',
    'It had finally let go of the {time}.',
  ],
  epic: [
    'The {place} sent word: {topic} had crossed the ridge at {time}.',
    'A {noun} was called to carry the {adj} standard.',
    'Three days of storm stood between them and the pass.',
    'They lit a beacon on the {noun} and held the night.',
    'At the eleventh hour, {topic} made its stand.',
    'The {adj} banners rose like a second dawn.',
    'By morning the {place} rang with iron and song.',
    'And the story of {topic} began its long march.',
  ],
};

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

const TITLE_TEMPLATES = [
  'Ode to {topic}',
  'Where {topic} Sings',
  'Notes on {topic}',
  'The {adj} {noun}',
  '{topic} at {time}',
  'A {adj} Morning',
  'Letters About {topic}',
  'The {noun} of the {place}',
];

// ---------------------------------------------------------------------------
// Style generators
// ---------------------------------------------------------------------------

function makeHaiku(mood, topic, rng) {
  const bank = HAIKU_BANKS[mood];
  const l5a = pick(bank.l5, rng);
  const l7 = pick(bank.l7, rng);
  const l5b = pick(bank.l5, rng);
  let lines = [capitalize(l5a), capitalize(l7), capitalize(l5b)];
  if (topic) {
    lines[2] = `and {topic}`;
    lines[2] = fill(lines[2], WORD_BANKS[mood], topic, rng);
    lines[2] = capitalize(lines[2]);
  }
  return { poem: lines.join('\n') };
}

function makeFreeVerse(mood, topic, length, rng) {
  const bank = WORD_BANKS[mood];
  const count = { short: 4, medium: 8, long: 14 }[length];
  let fragments = shuffle(FRAGMENTS[mood], rng);
  while (fragments.length < count) {
    fragments = fragments.concat(fragments.slice(0, count - fragments.length));
  }
  const chosen = fragments.slice(0, count).map((f) => capitalize(fill(f, bank, topic, rng)));
  return { poem: chosen.join('\n'), title: makeTitle(bank, topic, rng) };
}

function makeRhyming(mood, topic, length, rng) {
  const bank = WORD_BANKS[mood];
  const couples = { short: 2, medium: 3, long: 4 }[length];
  const picked = shuffle(COUPLETS[mood], rng).slice(0, couples);
  const lines = [];
  for (const [a, b] of picked) {
    lines.push(fill(a, bank, topic, rng), fill(b, bank, topic, rng));
  }
  return { poem: lines.join('\n'), title: makeTitle(bank, topic, rng) };
}

function makeLimerick(mood, topic, rng) {
  const bank = WORD_BANKS[mood];
  const limerick = pick(LIMERICKS[mood], rng);
  const lines = limerick.map((line) => fill(line, bank, topic, rng));
  return { poem: lines.join('\n'), title: makeTitle(bank, topic, rng) };
}

function makeStory(mood, topic, length, rng) {
  const bank = WORD_BANKS[mood];
  const count = { short: 3, medium: 5, long: 8 }[length];
  const sentences = shuffle(STORY_SENTENCES[mood], rng).slice(0, count);
  const story = sentences.map((s) => capitalize(fill(s, bank, topic, rng))).join(' ');
  return { poem: story, title: makeTitle(bank, topic, rng) };
}

function makeTitle(bank, topic, rng) {
  const t = pick(TITLE_TEMPLATES, rng);
  return capitalize(fill(t, bank, topic, rng));
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

function generateEngine(inputs, seed) {
  const { mood, style, length, topic } = inputs;
  const rng = typeof seed === 'number' ? mulberry32(seed) : mulberry32(Math.floor(Math.random() * 2 ** 31));
  const topicClean = typeof topic === 'string' ? cleanText(topic) : '';

  let result;
  switch (style) {
    case 'haiku':
      result = makeHaiku(mood, topicClean, rng);
      break;
    case 'free-verse':
      result = makeFreeVerse(mood, topicClean, length, rng);
      break;
    case 'rhyming':
      result = makeRhyming(mood, topicClean, length, rng);
      break;
    case 'limerick':
      result = makeLimerick(mood, topicClean, rng);
      break;
    case 'micro-story':
      result = makeStory(mood, topicClean, length, rng);
      break;
    default:
      result = makeFreeVerse(mood, topicClean, length, rng);
      break;
  }

  const poem = cleanText(result.poem);
  return {
    poem,
    title: result.title ? cleanText(result.title) : undefined,
    mood: MOOD_LABELS[mood],
    style,
  };
}

module.exports = {
  MOODS,
  STYLES,
  LENGTHS,
  generateEngine,
  _internal: { mulberry32, hashCode, pick, shuffle, fill, cleanText },
};

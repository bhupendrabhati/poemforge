'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { generatePoem, ValidationError } = require('./generate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, name: 'poemforge-backend' });
});

app.post('/api/generate', async (req, res) => {
  try {
    const result = await generatePoem(req.body || {});
    res.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message, fields: err.fields });
    }
    console.error('Generation failed:', err);
    res.status(500).json({ error: 'Something went wrong while forging your poem. Please try again.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PoemForge backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;

const frontendDist =
  process.env.FRONTEND_DIST || path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`PoemForge frontend served from ${frontendDist}`);
}

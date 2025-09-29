#!/usr/bin/env node
// Simple HAFAS proxy for parsing connection HTML or fetching HAFAS URL and parsing
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import parser from src (uses regex fallback in Node)
import hafasParser from '../src/utils/hafasParser.js';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

app.post('/hafas/parse', async (req, res) => {
  try {
    const { url, html } = req.body || {};
    let source = html || null;
    if (!source && url) {
      // use global fetch (Node 18+) or whatever polyfill environment provides
      const r = await fetch(url, { headers: { 'User-Agent': 'bde-evidencija-proxy/1.0' } });
      if (!r.ok) return res.status(502).json({ error: `Upstream fetch failed ${r.status}` });
      source = await r.text();
    }
    if (!source) return res.status(400).json({ error: 'Provide html or url in body' });

    const parsed = hafasParser.parseHafasConnectionHTML(source);
    // normalize output: durationSeconds, distanceMeters
    const durationSeconds = parsed.durationMinutes ? parsed.durationMinutes * 60 : null;
    const distanceMeters = parsed.distanceMeters || null;
    return res.json({ durationSeconds, distanceMeters, durationText: parsed.durationText, distanceText: parsed.distanceText });
  } catch (err) {
    console.error('hafas-proxy error', err);
    return res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`HAFAS proxy listening on http://localhost:${port}`);
});

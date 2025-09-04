import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (_req, res) => res.status(200).type('text/plain').send('ok'));

// Minimal read-only proxy for CSV/JSON (used by RealTimeData)
app.get('/api/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url query parameter required' });
    }
    const r = await fetch(url);
    const ct = r.headers.get('content-type') || '';
    if (!/^text\/csv|application\/json/.test(ct)) {
      return res.status(400).json({ error: 'unsupported content-type', contentType: ct });
    }
    const body = await r.text();
    res.status(r.status).type(ct).send(body);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Simple chat completion proxy to Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const message = req.body?.message;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message required' });
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'missing API key' });
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      },
    );
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Static assets from Vite build
const distDir = path.join(__dirname, 'dist');
app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }));
app.use(express.static(distDir, { maxAge: '5m' }));

// SPA fallback
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});


import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '50mb' }));

// In dev environment, prevent indexing by search engines
const isNoIndexEnv = (
  process.env.NO_INDEX === '1' ||
  /dev/i.test(process.env.K_SERVICE || '') ||
  /dev/i.test(process.env.SERVICE || '') ||
  /dev/i.test(process.env.NODE_ENV || '')
);
if (isNoIndexEnv) {
  // Send X-Robots-Tag for all responses
  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });
  // Serve a robots.txt that disallows everything
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  });
}

app.get('/healthz', (_req, res) => res.status(200).type('text/plain').send('ok'));

// Read-only proxy for CSV/JSON from allowlisted hosts (GitHub raw/API, Decide Madrid)
app.get('/api/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'url query parameter required' });
    }

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'invalid url' });
    }

    const allowedHosts = ['raw.githubusercontent.com', 'api.github.com', 'decide.madrid.es'];
    if (!allowedHosts.includes(parsed.hostname)) {
      return res.status(400).json({ error: `host not allowed: ${parsed.hostname}` });
    }

    const headers = {
      'User-Agent': 'AIRE-Guardianes/1.0 (+https://github.com/antoniomoneo)'
    };
    if (process.env.GITHUB_TOKEN && (parsed.hostname === 'raw.githubusercontent.com' || parsed.hostname === 'api.github.com')) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const r = await fetch(targetUrl, { headers });
    const ct = r.headers.get('content-type') || '';
    // Accept common types returned by GitHub raw/API and CSV endpoints
    if (!(/^(text\/csv|application\/json|text\/plain)/.test(ct))) {
      return res.status(400).json({ error: 'unsupported content-type', contentType: ct });
    }
    const body = await r.arrayBuffer();
    res.status(r.status).type(ct).send(Buffer.from(body));
  } catch (e) {
    console.error('proxy error', e);
    res.status(500).json({ error: String(e) });
  }
});

// Chat completion proxy compatible with frontend (POST /api/gemini/generate)
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'La clave de API de Gemini (API_KEY) no está configurada en el servidor.' });
    }

    const { model = 'gemini-pro', contents, generationConfig, safetySettings } = req.body || {};
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'contents array required' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig, safetySettings }),
    });
    const text = await r.text();
    res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text);
  } catch (e) {
    console.error('gemini error', e);
    res.status(500).json({ error: String(e) });
  }
});

// Backward-compatible minimal chat endpoint
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
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
      },
    );
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// GitHub API proxy for gallery operations
const GITHUB_API_URL = 'https://api.github.com/repos/antoniomoneo/Aire-gallery/contents';
app.all('/api/github/*', async (req, res) => {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({ error: 'El token de GitHub (GITHUB_TOKEN) no está configurado en el servidor.' });
    }

    const githubPath = req.params[0] || '';
    const targetUrl = `${GITHUB_API_URL}/${githubPath}`;

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'User-Agent': 'AIRE-Guardianes/1.0',
    };

    const init = { method: req.method, headers };
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
      init.body = JSON.stringify(req.body);
      init.headers['Content-Type'] = 'application/json';
    }

    const r = await fetch(targetUrl, init);
    const body = await r.text();
    res.status(r.status).type(r.headers.get('content-type') || 'text/plain').send(body);
  } catch (e) {
    console.error('github proxy error', e);
    res.status(502).json({ error: 'Bad gateway', detail: String(e) });
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

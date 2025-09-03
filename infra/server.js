import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.set("trust proxy", true);
const port = process.env.PORT || 8080;

// Resolve absolute paths (ESM-compatible __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");

// Parse JSON bodies for API endpoints
app.use(express.json({ limit: "50mb" }));

// Health endpoints for Cloud Run and probes
app.get("/healthy", (_req, res) => res.status(200).type("text/plain").send("ok"));
app.get("/healthz", (_req, res) => res.status(200).type("text/plain").send("ok"));
app.get("/_ah/health", (_req, res) => res.status(200).type("text/plain").send("ok"));

// Proxy to Google Gemini API
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "API_KEY not configured" });
    }
    const { model = "gemini-1.5-flash", ...rest } = req.body || {};
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rest),
    });
    const ct = r.headers.get("content-type") || "application/json";
    const txt = await r.text();
    res.status(r.status).type(ct).send(txt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Proxy to GitHub API for gallery operations
app.all("/api/github/*", async (req, res) => {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ error: "GITHUB_TOKEN not configured" });
    }
    const target = `https://api.github.com/${req.params[0]}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    const r = await fetch(target, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "content-type": req.headers["content-type"] || "application/json",
        Accept: req.headers["accept"] || "application/vnd.github+json",
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });
    const ct = r.headers.get("content-type") || "application/json";
    const txt = await r.text();
    res.status(r.status).type(ct).send(txt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Read-only proxy for external CSV/JSON files
app.get("/api/proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url query parameter required" });
    }
    const r = await fetch(url);
    const ct = r.headers.get("content-type") || "";
    if (!/^application\/json|text\/csv/.test(ct)) {
      return res.status(400).json({ error: "unsupported content-type" });
    }
    const txt = await r.text();
    res.status(r.status).type(ct).send(txt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Cache static hashed assets aggressively
app.use(
  "/assets",
  express.static(path.join(distDir, "assets"), {
    immutable: true,
    maxAge: "1y",
    fallthrough: true,
  })
);

// Serve other static files (index.css, icons, etc.) with modest caching
app.use(
  express.static(distDir, {
    maxAge: "5m",
    fallthrough: true,
  })
);

// SPA fallback: always return index.html for unknown routes
app.get("*", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(indexHtml);
});

app.listen(port, () => console.log(`Listening on :${port}`));

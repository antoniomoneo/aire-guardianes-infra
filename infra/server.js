import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 8080;

// Resolve absolute paths (ESM-compatible __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");

// Health endpoints for Cloud Run and probes
app.get("/healthz", (_req, res) => res.status(200).type("text/plain").send("ok"));
app.get("/_ah/health", (_req, res) => res.status(200).type("text/plain").send("ok"));

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

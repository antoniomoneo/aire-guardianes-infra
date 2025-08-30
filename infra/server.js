import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

const distPath = path.join(__dirname, "dist");
console.log("Serving dist from:", distPath);

app.use(express.static(distPath, { index: false }));

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => console.log(`Listening on :${port}`));

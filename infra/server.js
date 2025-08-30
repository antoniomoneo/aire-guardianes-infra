import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 8080;

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath, { index: false }));

// 🔧 Express 5: usar regex o ':path(*)' en vez de '*'
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => console.log(`Listening on :${port}`));

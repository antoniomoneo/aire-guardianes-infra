import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// carpeta con el build de Vite (dist) junto a este server
const distPath = path.join(__dirname, "dist");

// 1) servir ficheros estáticos
app.use(express.static(distPath, { index: false }));

// 2) fallback SPA: todas las rutas devuelven el index.html de dist
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => console.log(`Listening on :${port}`));

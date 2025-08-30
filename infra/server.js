import express from "express";
const app = express();
const port = process.env.PORT || 8080;
app.get("/healthz", (_req, res) => res.status(200).type("text/plain").send("ok"));
app.get("/_ah/health", (_req, res) => res.status(200).type("text/plain").send("ok"));
app.use((req, res) => res.status(200).type("text/plain").send(`ok ${req.method} ${req.path}`));
app.listen(port, () => console.log(`Listening on :${port}`));

import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import "dotenv/config";
import { requireAuth } from "./auth.js";
import adminRoutes, { publicRoutes } from "./routes-admin.js";
import restRoutes from "./rest.js";
import aiRoutes from "./routes-ai.js";
import fbrRoutes from "./routes-fbr.js";
import { repairSchema } from "./schema-repair.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true }));
app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", publicRoutes);
app.use("/api", adminRoutes);
app.use("/api", aiRoutes);
app.use("/api", fbrRoutes);
app.use("/api", requireAuth, restRoutes);

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Serve the built React app (frontend/dist/client copied into ./public)
const pub = path.resolve(process.env.PUBLIC_DIR || "public");
const shell = fs.existsSync(path.join(pub, "_shell.html")) ? "_shell.html" : "index.html";
app.use(express.static(pub, { index: false }));
app.get(/.*/, (_req, res) => res.sendFile(path.join(pub, shell), (e) => e && res.status(404).send("Frontend not built yet")));

app.use((err, _req, res, _next) => {
  if (!err.status) console.error(err);
  const msg = err.sqlMessage || err.message || "Server error";
  res.status(err.status || (err.sqlState === "45000" ? 409 : 500)).json({ error: msg });
});

const port = Number(process.env.PORT || 4000);
// Known compatibility repairs are not a replacement for ordered migrations.
// Do not expose a partially repaired database to document requests.
repairSchema()
  .then(() => app.listen(port, () => console.log(`Bilal Autos server on http://localhost:${port}`)))
  .catch((e) => {
    console.error("Server not started: database compatibility repair failed. Keep the current database and review the error:", e.sqlMessage || e.message);
    process.exit(1);
  });

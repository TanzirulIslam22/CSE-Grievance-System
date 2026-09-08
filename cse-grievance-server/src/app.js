import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config/index.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import caseRoutes from "./routes/cases.js";
import evidenceRoutes from "./routes/evidence.js";
import adminRoutes from "./routes/admin.js";
import auditRoutes from "./routes/audit.js";
import analyticsRoutes from "./routes/analytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.use(generalLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/analytics", analyticsRoutes);

// Production: serve the built React client (single-host deployment).
const clientDist = path.resolve(__dirname, "../../cse-grievance-client/dist");
if (config.nodeEnv === "production" && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/|socket\.io\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;

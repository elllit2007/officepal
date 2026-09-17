import express from "express";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { requireSharedSecret } from "./lib/auth.js";
import { processReport } from "./routes/processReport.js";
import { approve } from "./routes/approve.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/process-report", requireSharedSecret, processReport);
app.post("/approve", requireSharedSecret, approve);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("unhandled error", { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ error: "internal_error" });
});

app.listen(config.port, () => {
  logger.info(`orchestrator listening on port ${config.port}`);
});
